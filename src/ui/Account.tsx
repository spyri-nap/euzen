import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AccountError,
  AccountService,
  accountClient,
  type Profile,
} from "../data/auth";
import { getLanguage, useLanguage } from "../i18n";
import { Field } from "./common";

const env = (
  import.meta as ImportMeta & { env: Record<string, string | undefined> }
).env;
const client = accountClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
const service = client ? new AccountService(client) : null;
const copy = {
  title: ["Dein Testkonto", "Your test account"],
  boundary: [
    "Nur das Profil liegt im Konto. Dein Training bleibt separat auf diesem Gerät; noch kein Cloud-Sync und keine automatische Datenübernahme.",
    "Only your profile belongs to this account. Training stays separately on this device; no cloud sync or automatic data adoption yet.",
  ],
  config: [
    "Die Testanmeldung ist noch nicht konfiguriert.",
    "Test sign-in has not been configured yet.",
  ],
  loading: ["Konto wird geladen …", "Loading account …"],
  email: ["E-Mail-Adresse", "Email address"],
  send: ["Code anfordern / erneut senden", "Request / resend code"],
  code: ["E-Mail-Code", "Email code"],
  verify: ["Code bestätigen", "Verify code"],
  change: ["Andere E-Mail verwenden", "Use another email"],
  sent: [
    "Falls der Versand möglich ist, findest du den Code in deinem Postfach. Prüfe auch Spam.",
    "If delivery is available, check your inbox and spam folder for the code.",
  ],
  cooldown: [
    "Bitte vor dem erneuten Versand kurz warten.",
    "Please wait before requesting another code.",
  ],
  offline: [
    "Du bist offline. Für Kontoaktionen brauchst du Internet.",
    "You are offline. Account actions need an internet connection.",
  ],
  invalid: [
    "Bitte Eingabe prüfen. Codes können ungültig oder abgelaufen sein.",
    "Check your input. Codes may be invalid or expired.",
  ],
  failed: [
    "Kontoaktion fehlgeschlagen. Bitte erneut versuchen.",
    "Account action failed. Please try again.",
  ],
  retry: ["Profil erneut laden", "Reload profile"],
  name: ["Anzeigename", "Display name"],
  language: ["Profilsprache", "Profile language"],
  goals: [
    "Ziele (optional, durch Kommas getrennt)",
    "Goals (optional, comma-separated)",
  ],
  equipment: [
    "Equipment (optional, durch Kommas getrennt)",
    "Equipment (optional, comma-separated)",
  ],
  minutes: ["Trainingsminuten (optional)", "Training minutes (optional)"],
  experience: ["Erfahrung (optional)", "Experience (optional)"],
  none: ["Keine Angabe", "Not specified"],
  beginner: ["Einsteiger", "Beginner"],
  intermediate: ["Fortgeschritten", "Intermediate"],
  advanced: ["Erfahren", "Advanced"],
  save: ["Profil speichern", "Save profile"],
  saved: ["Profil im Konto gespeichert.", "Profile saved to your account."],
  logout: ["Auf diesem Gerät abmelden", "Sign out on this device"],
  private: [
    "Deine E-Mail wird für Anmeldung und Kontoverwaltung an Supabase übermittelt. Keine Trainingsdaten werden hier hochgeladen.",
    "Your email is sent to Supabase for sign-in and account management. No training data is uploaded here.",
  ],
} as const;
type Key = keyof typeof copy;
function text(key: Key) {
  return copy[key][getLanguage() === "en" ? 1 : 0];
}
function failure(e: unknown) {
  return text(
    e instanceof AccountError
      ? e.code === "offline"
        ? "offline"
        : e.code === "cooldown"
          ? "cooldown"
          : ["invalid_code", "invalid_email", "verify_failed"].includes(e.code)
            ? "invalid"
            : "failed"
      : "failed",
  );
}

export function Account() {
  useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!client);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const epoch = useRef(0);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    if (!client)
      return () => {
        alive.current = false;
      };
    // Subscription handles INITIAL_SESSION too; no racing getSession result.
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      epoch.current++;
      setSession(next);
      setReady(true);
      setBusy(false);
      setCode("");
      setError("");
      setNotice(false);
    });
    const tick = window.setInterval(() => setClock(Date.now()), 1000);
    return () => {
      alive.current = false;
      epoch.current++;
      data.subscription.unsubscribe();
      clearInterval(tick);
    };
  }, []);
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    const current = epoch.current;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      if (alive.current && epoch.current === current) setError(failure(e));
    } finally {
      if (alive.current && epoch.current === current) {
        setBusy(false);
        setClock(Date.now());
      }
    }
  }
  return (
    <section aria-label={text("title")}>
      <h3>{text("title")}</h3>
      <p className="hint">{text("boundary")}</p>
      {!service ? (
        <p role="status">{text("config")}</p>
      ) : !ready ? (
        <p role="status">{text("loading")}</p>
      ) : session ? (
        <>
          <ProfileForm
            key={session.user.id}
            service={service}
            owner={session.user.id}
          />
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void run(() => service.signOut())}
          >
            {text("logout")}
          </button>
        </>
      ) : (
        <>
          <p className="hint">{text("private")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const target = await service.requestCode(email);
                if (alive.current) {
                  setSentTo(target);
                  setNotice(true);
                }
              });
            }}
          >
            <Field label={text("email")}>
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                disabled={busy || Boolean(sentTo)}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <button className="btn" disabled={busy || clock < service.retryAt}>
              {text("send")}
            </button>
          </form>
          {notice && <p role="status">{text("sent")}</p>}
          {clock < service.retryAt && <p>{text("cooldown")}</p>}
          {sentTo && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => service.verifyCode(sentTo, code));
              }}
            >
              <Field label={text("code")}>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6,10}"
                  maxLength={10}
                  value={code}
                  disabled={busy}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <button className="btn primary" disabled={busy}>
                {text("verify")}
              </button>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => {
                  setSentTo("");
                  setCode("");
                  setNotice(false);
                  setError("");
                }}
              >
                {text("change")}
              </button>
            </form>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

function ProfileForm({
  service,
  owner,
}: {
  service: AccountService;
  owner: string;
}) {
  const [profile, setProfile] = useState<Omit<Profile, "user_id"> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    let valid = true;
    setProfile(null);
    setError("");
    setBusy(true);
    void service
      .loadProfile()
      .then((p) => {
        if (valid)
          setProfile(
            p ?? {
              display_name: "",
              language: getLanguage(),
              goals: [],
              equipment: [],
              preferred_minutes: null,
              experience: null,
            },
          );
      })
      .catch((e) => {
        if (valid) setError(failure(e));
      })
      .finally(() => {
        if (valid) setBusy(false);
      });
    return () => {
      valid = false;
      alive.current = false;
    };
  }, [service, owner, retry]);
  function change(patch: Partial<Omit<Profile, "user_id">>) {
    setSaved(false);
    setProfile((p) => (p ? { ...p, ...patch } : p));
  }
  if (!profile)
    return (
      <div>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="btn" onClick={() => setRetry((n) => n + 1)}>
              {text("retry")}
            </button>
          </>
        ) : (
          <p role="status">{text("loading")}</p>
        )}
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        setSaved(false);
        try {
          const next = await service.saveProfile(profile);
          if (alive.current) {
            setProfile(next);
            setSaved(true);
          }
        } catch (e) {
          if (alive.current) setError(failure(e));
        } finally {
          if (alive.current) setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        <Field label={text("name")}>
          <input
            required
            maxLength={100}
            value={profile.display_name}
            onChange={(e) => change({ display_name: e.target.value })}
          />
        </Field>
        <Field label={text("language")}>
          <select
            value={profile.language}
            onChange={(e) =>
              change({ language: e.target.value as "de" | "en" })
            }
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </Field>
        {(["goals", "equipment"] as const).map((key) => (
          <Field key={key} label={text(key)}>
            <input
              maxLength={1500}
              defaultValue={profile[key].join(", ")}
              onBlur={(e) =>
                change({
                  [key]: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        ))}
        <Field label={text("minutes")}>
          <input
            type="number"
            min={1}
            max={300}
            value={profile.preferred_minutes ?? ""}
            onChange={(e) =>
              change({
                preferred_minutes: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
          />
        </Field>
        <Field label={text("experience")}>
          <select
            value={profile.experience ?? ""}
            onChange={(e) =>
              change({
                experience: (e.target.value || null) as Profile["experience"],
              })
            }
          >
            <option value="">{text("none")}</option>
            {(["beginner", "intermediate", "advanced"] as const).map((v) => (
              <option key={v} value={v}>
                {text(v)}
              </option>
            ))}
          </select>
        </Field>
        <button className="btn primary">{text("save")}</button>
      </fieldset>
      {saved && <p role="status">{text("saved")}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
