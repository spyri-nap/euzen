import { useCallback, useEffect, useRef, useState } from "react";
import { type AppState } from "../domain/model";
import { loadState, saveState } from "./storage";

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
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const current = useRef<AppState | null>(null);
  const writes = useRef(Promise.resolve());
  const pending = useRef(0);
  useEffect(() => {
    let alive = true;
    const initialize = async () => {
      try {
        const s = await loadState();
        if (alive) {
          current.current = s;
          setState(s);
        }
      } catch {
        if (alive)
          setError(
            "Die lokalen Daten konnten nicht geöffnet werden. Bitte prüfe die Browser-Speichereinstellungen. Bestehende Daten werden nicht überschrieben.",
          );
      }
    };
    void acquireWriter().then((permission) => {
      if (!alive) return;
      setReadonly(!permission);
      void initialize();
    });
    return () => {
      alive = false;
    };
  }, []);
  const persist = useCallback((next: AppState) => {
    pending.current += 1;
    setSaving(true);
    writes.current = writes.current
      .catch(() => {})
      .then(() => saveState(next))
      .then(() => {
        setError("");
      })
      .catch(() => {
        setError(
          "Speichern fehlgeschlagen. Deine Änderungen sind aktuell nur in dieser Ansicht. Exportiere ein Backup oder versuche es erneut.",
        );
      })
      .finally(() => {
        pending.current -= 1;
        setSaving(pending.current > 0);
      });
  }, []);
  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      if (!current.current || readonly) return;
      const next = fn(current.current);
      current.current = next;
      setState(next);
      persist(next);
    },
    [persist, readonly],
  );
  return {
    state,
    update,
    error,
    saving,
    readonly,
    retry: () => {
      if (current.current) persist(current.current);
      else location.reload();
    },
  };
}
