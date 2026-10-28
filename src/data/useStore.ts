import { registerEditBases, editExpectations } from "./editBasis";
import { hasOpenEditor, onEditorsClosed } from "./editGuard";
import { useCallback, useEffect, useRef, useState } from "react";
import { validateState, type AppState } from "../domain/model";
import { loadState, saveState } from "./storage";
import { client, accountSyncEnabled } from "./client";
import {
  loadAccount,
  saveAccount,
  stageAccount,
  acknowledgeAccount,
  resolveAccount,
} from "./accountStore";
import { cloudTransport } from "./cloud";
import { drain, type SyncConflict } from "./sync";
import { classifySyncFailure } from "./syncFailure";
import { mergeGuest } from "./reconcile";

// One lease per browser document, shared across React StrictMode remounts.
let writerPermission: Promise<boolean> | undefined;
function acquireWriter(): Promise<boolean> {
  if (!navigator.locks) return Promise.resolve(true);
  writerPermission ??= new Promise<boolean>((resolve) => {
    void navigator.locks
      .request("euzen-editor", { ifAvailable: true }, async (lock) => {
        resolve(Boolean(lock));
        if (lock)
          await new Promise<void>((release) =>
            window.addEventListener("pagehide", () => release(), {
              once: true,
            }),
          );
      })
      .catch(() => resolve(false));
  });
  return writerPermission;
}

export function useStore() {
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [syncStatus, setSyncStatus] = useState("loading");
  const current = useRef<AppState | null>(null);
  const owner = useRef<string | null>(null);
  const epoch = useRef(0);
  const generation = useRef(0);
  const dirty = useRef(false);
  const writeSequence = useRef(0);
  const writes = useRef(Promise.resolve());
  const control = useRef(new AbortController());
  const synchronize = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    let alive = true;
    let last: string | null | undefined;
    let busy = false;
    let writable = false;
    let halted = false;
    let requested = false;
    let attempts = 0;
    let retryTimer: number | undefined;
    const status = (value: string) => {
      if (alive) setSyncStatus(value);
    };
    async function sync() {
      const id = owner.current,
        version = epoch.current;
      if (!id || !writable || !navigator.onLine || halted) return;
      if (busy) {
        requested = true;
        return;
      }
      busy = true;
      try {
        await writes.current;
        if (!alive || version !== epoch.current) return;
        if (dirty.current) return;
        const local = await loadAccount(id);
        if (!alive || version !== epoch.current) return;
        const transport = cloudTransport(client!, id);
        const signal = control.current.signal;
        if (local) {
          const conflict = await drain(
            local.outbox,
            transport,
            signal,
            acknowledgeAccount,
          );
          if (conflict) {
            if (version === epoch.current) {
              halted = true;
              setConflict(conflict);
              status("conflict");
              setError(
                "Synchronisierungskonflikt / Sync conflict. Lokale Daten bleiben erhalten. / Local data preserved.",
              );
            }
            return;
          }
        }
        await writes.current;
        if (version !== epoch.current) return;
        const pullSequence = writeSequence.current;
        const fresh = await transport.pull(signal);
        attempts = 0;
        if (version !== epoch.current) return;
        // Do not replace edits made while the pull was in flight.
        writes.current = writes.current.then(async () => {
          if (version !== epoch.current) return;
          const latest = await loadAccount(id);
          if (
            (Boolean(latest) && hasOpenEditor()) ||
            dirty.current ||
            writeSequence.current !== pullSequence ||
            latest?.outbox.length ||
            latest?.state.sessions.some((s) => s.status === "active")
          ) {
            status("pending");
            return;
          }
          await saveAccount(
            id,
            fresh.generation,
            fresh.state,
            [],
            fresh.revisions,
          );
          if (
            version === epoch.current &&
            writeSequence.current === pullSequence &&
            !dirty.current
          ) {
            generation.current = fresh.generation;
            registerEditBases(
              fresh.state,
              id,
              fresh.generation,
              fresh.revisions,
              [],
            );
            current.current = fresh.state;
            setState(fresh.state);
            status("synced");
            setError("");
          }
        });
        await writes.current;
      } catch (failure) {
        if (alive && version === epoch.current) {
          const kind = classifySyncFailure(failure, navigator.onLine);
          status(kind);
          halted = ["auth", "quota", "validation", "generation"].includes(kind);
          if (!halted && attempts < 5) {
            window.clearTimeout(retryTimer);
            retryTimer = window.setTimeout(
              () => {
                void sync();
              },
              Math.min(30000, 1000 * 2 ** attempts++) *
                (0.8 + Math.random() * 0.4),
            );
          }
          setError(
            "Cloud-Abgleich fehlgeschlagen. Lokale Daten bleiben erhalten. / Cloud sync failed. Local data preserved.",
          );
        }
      } finally {
        busy = false;
        if (requested && alive) {
          requested = false;
          queueMicrotask(() => {
            void sync();
          });
        }
      }
    }
    synchronize.current = async () => {
      halted = false;
      attempts = 0;
      await sync();
    };
    async function switchOwner(id: string | null) {
      if (last === id) return;
      last = id;
      epoch.current++;
      const version = epoch.current;
      control.current.abort();
      control.current = new AbortController();
      owner.current = id;
      current.current = null;
      dirty.current = false;
      setState(null);
      setError("");
      setConflict(null);
      attempts = 0;
      halted = false;
      window.clearTimeout(retryTimer);
      status("loading");
      try {
        await writes.current.catch(() => {});
        const permission = await acquireWriter();
        if (!alive || version !== epoch.current) return;
        writable = permission;
        setReadonly(!permission);
        if (!id) {
          const guest = await loadState();
          if (alive && version === epoch.current) {
            current.current = guest;
            setState(guest);
            status("guest");
          }
          return;
        }
        const local = await loadAccount(id);
        if (!alive || version !== epoch.current) return;
        if (local) {
          generation.current = local.generation;
          registerEditBases(
            local.state,
            id,
            local.generation,
            local.revisions,
            local.outbox,
          );
          current.current = local.state;
          setState(local.state);
          status(
            !permission ? "readonly" : navigator.onLine ? "pending" : "offline",
          );
        }
        if (!navigator.onLine && !local) {
          setError(
            "Dieses Konto ist offline noch nicht verfügbar. Internetverbindung herstellen und erneut versuchen. / This account is not cached. Reconnect and retry.",
          );
          status("offline");
          return;
        }
        if (!permission && !local) {
          setError(
            "Bitte den bearbeitenden Tab verwenden oder andere Tabs schließen und neu laden. / Use the editing tab or close other tabs and reload.",
          );
          return;
        }
        await sync();
      } catch {
        if (alive && version === epoch.current) {
          setError(
            "Speicher konnte nicht geladen werden. / Storage could not be loaded.",
          );
          status("error");
        }
      }
    }
    const subscription = (
      accountSyncEnabled ? client : null
    )?.auth.onAuthStateChange((_event, session) => {
      // Invalidate visible data synchronously; avoid Supabase calls inside callback.
      const id = session?.user.id ?? null;
      if (last !== id) {
        epoch.current++;
        control.current.abort();
        current.current = null;
        setState(null);
      }
      setTimeout(() => {
        if (alive) void switchOwner(id);
      }, 0);
    });
    if (!client || !accountSyncEnabled) void switchOwner(null);
    const stopEditorListener = onEditorsClosed(() => {
      if (alive) void sync();
    });
    const online = () => {
      void sync();
    };
    const offline = () => {
      if (owner.current) status("offline");
    };
    window.addEventListener("offline", offline);
    const visible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", visible);
    const timer = window.setInterval(() => {
      if (syncStatus !== "conflict") void sync();
    }, 60000);
    return () => {
      alive = false;
      stopEditorListener();
      epoch.current++;
      control.current.abort();
      subscription?.data.subscription.unsubscribe();
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
      clearInterval(timer);
      window.clearTimeout(retryTimer);
    };
  }, []);
  const persist = useCallback(
    (next: AppState, expected: Record<string, number> = {}) => {
      const id = owner.current,
        version = epoch.current;
      const writeGeneration = generation.current;
      const sequence = ++writeSequence.current;
      let succeeded = true;
      dirty.current = true;
      setSaving(true);
      writes.current = writes.current
        .catch(() => {})
        .then(async () => {
          if (id) {
            const local = await loadAccount(id);
            if (!local) throw Error("Account not initialized");
            const staged = await stageAccount(
              id,
              writeGeneration,
              next,
              expected,
            );
            registerEditBases(
              next,
              id,
              writeGeneration,
              staged.revisions,
              staged.outbox,
            );
          } else await saveState(next);
          if (version === epoch.current) {
            if (sequence === writeSequence.current) dirty.current = false;
            setError("");
            setSyncStatus(id ? "pending" : "guest");
          }
        })
        .catch(() => {
          succeeded = false;
          if (version === epoch.current)
            setError(
              "Speichern fehlgeschlagen / Save failed. Bitte Backup exportieren / Please export a backup.",
            );
        })
        .finally(() => {
          if (version === epoch.current) setSaving(false);
        });
      void writes.current.then(() => {
        if (version === epoch.current) void synchronize.current();
      });
      return writes.current.then(() => succeeded && version === epoch.current);
    },
    [],
  );
  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      if (!current.current || readonly) return;
      const raw = fn(current.current);
      const expected = editExpectations(raw, owner.current, generation.current);
      const next = validateState(raw);
      current.current = next;
      setState(next);
      persist(next, expected);
    },
    [persist, readonly],
  );
  return {
    state,
    update,
    error,
    saving,
    readonly,
    syncStatus,
    accountOwner: owner.current,
    conflict,
    resolve: async (choice: "local" | "server") => {
      if (!conflict || conflict.operation.owner !== owner.current || readonly)
        return;
      const version = epoch.current;
      try {
        await writes.current;
        const result = await resolveAccount(conflict, choice);
        if (version !== epoch.current) return;
        registerEditBases(
          result.state,
          conflict.operation.owner,
          result.generation,
          result.revisions,
          result.outbox,
        );
        current.current = result.state;
        setState(result.state);
        setConflict(null);
        setError("");
        void synchronize.current();
      } catch {
        setError(
          "Auflösung nicht möglich: abhängige Änderungen prüfen. / Cannot resolve: check dependent changes.",
        );
      }
    },
    importGuest: async () => {
      if (!owner.current || readonly) return false;
      const version = epoch.current;
      try {
        const guest = await loadState();
        if (version !== epoch.current || !current.current) return false;
        const next = mergeGuest(current.current, guest);
        current.current = next;
        setState(next);
        return await persist(next);
      } catch {
        setError(
          "Übernahme abgebrochen: Check-ins am selben Datum oder aktive Sessions prüfen. Bitte beide Bereiche exportieren. / Import cancelled: review check-ins on the same date or active sessions. Export both areas.",
        );
        return false;
      }
    },
    retry: () => {
      if (dirty.current && current.current) persist(current.current);
      else if (owner.current) void synchronize.current();
      else if (current.current) persist(current.current);
      else location.reload();
    },
  };
}
