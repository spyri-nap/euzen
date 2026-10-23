import { t as tr } from "./i18n";
import { setLanguage, useLanguage } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Flower2,
  Leaf,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { useStore } from "./data/useStore";
import { exportState, parseBackup } from "./data/storage";
import {
  addDays,
  formatDate,
  localDate,
  monday,
  number,
  type AppState,
  type WorkoutTemplate,
} from "./domain/model";
import { estimateMinutes, newSession } from "./domain/timer";
import { summary } from "./domain/analytics";
import { Empty, Field, Modal, MovementArt } from "./ui/common";
import { Library } from "./ui/Library";
import { Editor } from "./ui/Editor";
import { Planning } from "./ui/Planning";
import { Progress } from "./ui/Progress";
import { Player } from "./ui/Player";
import { Space } from "./ui/Space";
import { MobileApp } from "./ui/MobileApp";

type View = "today" | "plan" | "library" | "progress" | "space" | "train";
const nav = [
  { id: "today", label: "Heute", icon: Sun },
  { id: "plan", label: "Planung", icon: CalendarDays },
  { id: "library", label: "Bibliothek", icon: BookOpen },
  { id: "progress", label: "Fortschritt", icon: Activity },
  { id: "space", label: "Space", icon: Flower2 },
] as const;

export function App() {
  useLanguage();
  const { state, update, error, saving, readonly, retry } = useStore();
  useEffect(() => {
    if (state) setLanguage(state.preferences.language);
  }, [state?.preferences.language]);
  const [view, setView] = useState<View>("today");
  const [editor, setEditor] = useState<WorkoutTemplate | "new" | null>(null);
  const [settings, setSettings] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);
  const [toast, setToast] = useState("");
  const active = state?.sessions.find((s) => s.status === "active");
  const previousActive = useRef<string | undefined>(undefined);
  const heading = useRef<HTMLElement>(null);
  useEffect(() => {
    if (previousActive.current && !active && view === "train") {
      setView("progress");
      setToast("Einheit beendet. Bitte den lokalen Speicherstatus prüfen.");
    }
    previousActive.current = active?.id;
  }, [active, view]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [view]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 7000);
    return () => clearTimeout(id);
  }, [toast]);
  const startWorkout = (template: WorkoutTemplate, scheduledId?: string) => {
    if (!state) return;
    if (active) {
      setResumePrompt(true);
      return;
    }
    const session = newSession(template, state.exercises, scheduledId ?? null);
    update((s) => ({ ...s, sessions: [...s.sessions, session] }));
    setView("train");
  };
  const navigate = (v: View) => setView(v);
  if (!state)
    return (
      <main className="boot">
        <div className="brand">
          {tr("Eúzēn")}
          <span>εὖ ζῆν</span>
        </div>
        {error ? (
          <>
            <h1>{tr("Ein kurzer Zwischenstopp.")}</h1>
            <p role="alert">{tr(error)}</p>
            <button className="btn primary" onClick={retry}>
              {tr("Erneut versuchen")}
            </button>
          </>
        ) : (
          <>
            <div className="loading-orbit" />
            <p>{tr("Dein Raum für Bewegung wird geöffnet …")}</p>
          </>
        )}
      </main>
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {tr("Zum Inhalt")}
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("today")}
          aria-label={tr("Eúzēn Startseite")}
        >
          {tr("Eúzēn")}
          <span>{tr("εὖ ζῆν · GUT LEBEN")}</span>
        </button>
        <p className="sidebar-caption">{tr("DEIN RAUM FÜR BEWEGUNG")}</p>
        <nav aria-label={tr("Hauptnavigation")}>
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "nav-link active" : "nav-link"}
              aria-current={view === n.id ? "page" : undefined}
              aria-label={tr(n.label)}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={20} strokeWidth={1.6} />
              <span>{tr(n.label)}</span>
              {view === n.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <Leaf size={25} strokeWidth={1.2} />
            <p>
              {tr("Gut leben.")}
              <br />
              {tr("In Bewegung bleiben.")}
            </p>
            <small>{tr("In deinem eigenen Rhythmus.")}</small>
          </div>
          <button
            className="nav-link"
            aria-label={tr("Einstellungen & Daten")}
            onClick={() => setSettings(true)}
          >
            <Settings2 size={19} />
            <span>{tr("Einstellungen & Daten")}</span>
          </button>
          <span className="local-label">
            <span className={`status-dot ${error ? "error-dot" : ""}`} />
            {error
              ? tr("Speicher prüfen")
              : saving
                ? tr("Wird gespeichert …")
                : tr("Lokal auf deinem Gerät")}
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-label">
            {tr("BEWEGUNG FÜR EIN GUTES LEBEN")}
          </span>
          <div className="topbar-right">
            <span className="date-label">
              {formatDate(localDate(), {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <button
              className="icon-btn mobile-settings"
              aria-label={tr("Einstellungen & Daten")}
              onClick={() => setSettings(true)}
            >
              <Settings2 size={20} />
            </button>
            <span
              className="avatar"
              aria-label={tr("Persönlicher lokaler Bereich")}
            >
              {tr("E")}
            </span>
          </div>
        </header>
        <MobileApp
          blocked={Boolean(active || editor || settings || saving || error)}
        />
        {error && (
          <div className="notice error" role="alert">
            {tr(error)}
            <button className="btn small-btn" onClick={retry}>
              {tr("Erneut speichern")}
            </button>
            <button
              className="btn small-btn"
              onClick={() => exportState(state)}
            >
              {tr("Backup exportieren")}
            </button>
          </div>
        )}
        {readonly && (
          <div className="notice" role="alert">
            {tr(
              "Eúzēn ist bereits in einem anderen Tab geöffnet. Schließe den anderen Tab und lade diese Ansicht neu, um Änderungen zu speichern.",
            )}
          </div>
        )}
        {active && view !== "train" && (
          <div className="resume-banner">
            <span>
              <span className="status-dot" />
              {tr("Deine Session wartet: ")}
              <strong>{active.snapshot.name}</strong>
            </span>
            <button className="text-button" onClick={() => setView("train")}>
              {tr("Fortsetzen")}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        <main
          id="main"
          ref={heading}
          tabIndex={-1}
          className={
            view === "train" ? "main-content training-content" : "main-content"
          }
        >
          <fieldset className="app-fieldset" disabled={readonly}>
            {view === "today" && (
              <Today
                state={state}
                update={update}
                onNavigate={navigate}
                onStart={startWorkout}
                onCreate={() => setEditor("new")}
              />
            )}
            {view === "plan" && (
              <Planning
                state={state}
                update={update}
                onEdit={(t) => setEditor(t ?? "new")}
                onStart={startWorkout}
              />
            )}
            {view === "library" && <Library state={state} update={update} />}
            {(view === "progress" || (view === "train" && !active)) && (
              <Progress state={state} update={update} />
            )}
            {view === "space" && (
              <Space state={state} onPlan={() => navigate("plan")} />
            )}
            {view === "train" && active && (
              <Player
                state={state}
                session={active}
                update={update}
                onExit={() => navigate("today")}
              />
            )}
          </fieldset>
        </main>
        <footer className="app-footer">
          <span>
            {tr("Eúzēn ")}
            <i>·</i>
            {tr(" Gut leben. In Bewegung bleiben.")}
          </span>
          <span>
            <ShieldCheck size={14} />
            {tr("Deine Daten bleiben auf diesem Gerät.")}
          </span>
        </footer>
      </div>
      {editor && (
        <Editor
          template={editor === "new" ? undefined : editor}
          exercises={state.exercises}
          onClose={() => setEditor(null)}
          onSave={(t) => {
            update((s) => ({
              ...s,
              templates: s.templates.some((x) => x.id === t.id)
                ? s.templates.map((x) => (x.id === t.id ? t : x))
                : [...s.templates, t],
            }));
            setEditor(null);
            setView("plan");
            setToast("Dein Workout ist gespeichert.");
          }}
        />
      )}
      {settings && (
        <Settings
          state={state}
          update={update}
          onClose={() => setSettings(false)}
        />
      )}
      {resumePrompt && (
        <Modal
          title={tr("Eine Session ist noch offen")}
          onClose={() => setResumePrompt(false)}
        >
          <p>
            {tr(
              "Setze deine aktuelle Session fort oder speichere sie dort als unvollständig, bevor du ein neues Workout startest.",
            )}
          </p>
          <div className="modal-actions">
            <button
              className="btn primary"
              onClick={() => {
                setResumePrompt(false);
                setView("train");
              }}
            >
              {tr("Zur offenen Session")}
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {tr(toast)}
          <button
            aria-label={tr("Hinweis schließen")}
            className="icon-btn"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function Today({
  state,
  update,
  onNavigate,
  onStart,
  onCreate,
}: {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  onNavigate: (v: View) => void;
  onStart: (t: WorkoutTemplate, scheduledId?: string) => void;
  onCreate: () => void;
}) {
  const today = localDate();
  const start = monday();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const upcoming = state.scheduled
    .filter(
      (p) =>
        p.kind === "workout" &&
        p.date >= today &&
        !state.sessions.some(
          (s) => s.scheduledId === p.id && s.status === "complete",
        ),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  const workout =
    state.templates.find((t) => t.id === next?.templateId) ??
    state.templates[0];
  const weekItems = state.scheduled.filter(
    (p) => days.includes(p.date) && p.kind === "workout",
  );
  const done = weekItems.filter((p) =>
    state.sessions.some(
      (s) => s.scheduledId === p.id && s.status === "complete",
    ),
  ).length;
  const stats = summary(state.sessions);
  const checkin = state.checkins.find((c) => c.date === today);
  const [checking, setChecking] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tr("KLEINE SCHRITTE. EIN GUTES LEBEN.")}</p>
          <h1>{tr("Schön, dass du da bist.")}</h1>
          <p>{tr("Dein Körper. Dein Tempo. Dein nächster guter Schritt.")}</p>
        </div>
        <button className="btn" onClick={onCreate}>
          <Plus size={17} />
          {tr("Eigenes Workout")}
        </button>
      </div>
      <div className="today-layout">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="status-dot" />
              {next
                ? next.date === today
                  ? tr("DEIN TRAINING FÜR HEUTE")
                  : `${tr("ALS NÄCHSTES")} · ${formatDate(next.date).toUpperCase()}`
                : tr("FINDE DEINEN RHYTHMUS")}
            </span>
            <h2>{workout?.name ?? tr("Dein erster guter Schritt.")}</h2>
            <p>
              {workout?.description ??
                tr(
                  "Gestalte dein erstes Workout. Mit Übungen, die zu dir passen.",
                )}
            </p>
            {workout && (
              <div className="hero-meta">
                <span>
                  <Dumbbell size={16} />
                  {tr(workout.dimension)}
                </span>
                <span>
                  {tr("◷ ca. ")}
                  {estimateMinutes(workout)}
                  {tr(" Min.")}
                </span>
                <span>
                  {workout.blocks.length}
                  {tr(" Blöcke")}
                </span>
              </div>
            )}
            <button
              className="btn cream"
              onClick={() =>
                workout ? onStart(workout, next?.id) : onCreate()
              }
            >
              {workout ? (
                <Play size={16} fill="currentColor" />
              ) : (
                <Plus size={16} />
              )}{" "}
              {workout ? tr("Workout starten") : tr("Workout erstellen")}
              <ArrowRight size={18} />
            </button>
            {workout?.sample && (
              <small className="hero-caption">
                {tr("Beispielvorlage · jederzeit anpassbar")}
              </small>
            )}
          </div>
          <MovementArt />
        </section>
        <section className="checkin-card">
          <span className="round-icon">
            <Sun size={23} strokeWidth={1.3} />
          </span>
          <p className="eyebrow">{tr("KURZ BEI DIR ANKOMMEN")}</p>
          <h2>{tr("Wie geht’s dir heute?")}</h2>
          <p>
            {checkin
              ? `Dein Check-in: Energie ${checkin.energy}/5 und Erholung ${checkin.recovery}/5. Schön, dass du dir den Moment genommen hast.`
              : tr(
                  "Ein kleiner Check-in hilft dir, bewusst in dein Training zu gehen.",
                )}
          </p>
          <button className="btn full" onClick={() => setChecking(true)}>
            {checkin ? tr("Check-in bearbeiten") : tr("Mein Check-in")}
            <ArrowRight size={16} />
          </button>
          <small>{tr("Freiwillig. Nur für dich.")}</small>
        </section>
      </div>
      <section className="panel weekly-summary">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {formatDate(start)} – {formatDate(addDays(start, 6))}
            </p>
            <h2>{tr("Deine Woche in Bewegung")}</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("plan")}>
            {tr("Plan gestalten")}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="week-strip">
          {days.map((day) => {
            const entries = state.scheduled.filter((p) => p.date === day);
            const workouts = entries.filter((p) => p.kind === "workout");
            const completedCount = workouts.filter((p) =>
              state.sessions.some(
                (s) => s.scheduledId === p.id && s.status === "complete",
              ),
            ).length;
            const completed =
              workouts.length > 0 && completedCount === workouts.length;
            const w = workouts.length > 0;
            return (
              <button
                className={`week-day ${day === today ? "today" : ""}`}
                key={day}
                onClick={() => onNavigate("plan")}
                aria-label={`${formatDate(day, { weekday: "long", day: "numeric", month: "long" })}: ${entries.map((p) => p.label).join(", ") || "frei"}`}
              >
                <span>{formatDate(day, { weekday: "short" })}</span>
                <strong>{formatDate(day, { day: "numeric" })}</strong>
                <span
                  className={`day-symbol ${w ? "workout" : ""} ${completed ? "completed" : ""}`}
                >
                  {completed ? (
                    <Check size={16} />
                  ) : w ? (
                    <Dumbbell size={16} />
                  ) : (
                    <Leaf size={16} />
                  )}
                </span>
                <small>
                  {completed
                    ? tr("Geschafft")
                    : completedCount > 0
                      ? `${completedCount}/${workouts.length} geschafft`
                      : w
                        ? tr("Training")
                        : entries.length
                          ? tr("Erholung")
                          : tr("Freiraum")}
                </small>
              </button>
            );
          })}
        </div>
        <div className="week-bottom">
          <div className="mini-progress">
            <span
              style={{
                width: `${weekItems.length ? (done / weekItems.length) * 100 : 0}%`,
              }}
            />
          </div>
          <span>
            <strong>
              {done}
              {tr(" von ")}
              {weekItems.length}
            </strong>{" "}
            {tr("geplanten Workouts abgeschlossen")}
          </span>
        </div>
      </section>
      <div className="section-head section-gap">
        <h2>{tr("Dein Weg, auf einen Blick")}</h2>
        <button className="text-button" onClick={() => onNavigate("progress")}>
          {tr("Fortschritt ansehen")}
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="today-stats">
        <div>
          <span className="round-icon">
            <Activity size={20} />
          </span>
          <div>
            <strong>{stats.complete}</strong>
            <span>{tr("Workouts abgeschlossen")}</span>
          </div>
        </div>
        <div>
          <span className="round-icon">
            <CalendarDays size={20} />
          </span>
          <div>
            <strong>{stats.days}</strong>
            <span>{tr("Aktive Trainingstage")}</span>
          </div>
        </div>
        <div>
          <span className="round-icon">
            <Dumbbell size={20} />
          </span>
          <div>
            <strong>
              {number(stats.minutes, 1)} <small>{tr("Min.")}</small>
            </strong>
            <span>{tr("Zeit für dich")}</span>
          </div>
        </div>
      </div>
      <div className="two-col section-gap">
        <section className="panel next-card">
          <div className="section-head">
            <h2>{tr("Dein nächster Rhythmus")}</h2>
            <CalendarDays size={20} />
          </div>
          {upcoming.slice(0, 2).map((p) => (
            <button
              className="upcoming-row"
              key={p.id}
              onClick={() => onNavigate("plan")}
            >
              <span className="date-tile">
                <small>{formatDate(p.date, { month: "short" })}</small>
                <strong>{formatDate(p.date, { day: "numeric" })}</strong>
              </span>
              <span>
                <strong>{p.label}</strong>
                <small>{formatDate(p.date, { weekday: "long" })}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
          {!upcoming.length && (
            <Empty
              title={tr("Platz für deinen nächsten Schritt")}
              text={tr(
                "Plane eine Einheit oder genieße bewusst einen freien Tag.",
              )}
              action={tr("Woche planen")}
              onAction={() => onNavigate("plan")}
            />
          )}
        </section>
        <button className="space-invite" onClick={() => onNavigate("space")}>
          <Sparkles size={23} strokeWidth={1.3} />
          <p className="eyebrow">{tr("EÚZĒN SPACE")}</p>
          <h2>
            {tr("Bewegung verstehen.")}
            <br />
            {tr("Gut für dich sorgen.")}
          </h2>
          <p>
            {tr("Wissen, Reflexion und neue Perspektiven für deinen Alltag.")}
          </p>
          <span className="text-button">
            {tr("Space entdecken")}
            <ArrowRight size={16} />
          </span>
        </button>
      </div>
      {checking && (
        <Checkin
          energy={checkin?.energy ?? 3}
          recovery={checkin?.recovery ?? 3}
          onClose={() => setChecking(false)}
          onSave={(energy, recovery) => {
            update((s) => ({
              ...s,
              checkins: [
                ...s.checkins.filter((c) => c.date !== today),
                { date: today, energy, recovery },
              ],
            }));
            setChecking(false);
          }}
        />
      )}
    </>
  );
}
function Checkin({
  energy: initialEnergy,
  recovery: initialRecovery,
  onClose,
  onSave,
}: {
  energy: number;
  recovery: number;
  onClose: () => void;
  onSave: (a: number, b: number) => void;
}) {
  const [energy, setEnergy] = useState(initialEnergy);
  const [recovery, setRecovery] = useState(initialRecovery);
  return (
    <Modal title={tr("Einen Moment für dich.")} onClose={onClose}>
      <p>
        {tr(
          "Wie fühlst du dich heute? Deine Einschätzung bleibt eine persönliche Notiz.",
        )}
      </p>
      {[
        { label: "Energie", value: energy, set: setEnergy },
        { label: "Erholung", value: recovery, set: setRecovery },
      ].map((item) => (
        <fieldset className="rating" key={item.label}>
          <legend>
            {tr(item.label)} · {item.value}/5
          </legend>
          <div>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                className={item.value === v ? "selected" : ""}
                key={v}
                aria-pressed={item.value === v}
                onClick={() => item.set(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <small>{tr("1 = wenig · 5 = sehr gut")}</small>
        </fieldset>
      ))}
      <div className="modal-actions">
        <button
          className="btn primary"
          onClick={() => onSave(energy, recovery)}
        >
          {tr("Check-in speichern")}
        </button>
      </div>
    </Modal>
  );
}
function Settings({
  state,
  update,
  onClose,
}: {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  onClose: () => void;
}) {
  const [incoming, setIncoming] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  return (
    <Modal title={tr("Deine Daten. Dein Raum.")} onClose={onClose}>
      <Field label={tr("Sprache der Oberfläche")}>
        <select
          value={state.preferences.language}
          onChange={(e) =>
            update((s) => ({
              ...s,
              preferences: {
                ...s.preferences,
                language: e.target.value as "de" | "en",
              },
            }))
          }
        >
          <option value="de" lang="de">
            Deutsch
          </option>
          <option value="en" lang="en">
            English
          </option>
        </select>
      </Field>
      <p className="hint">
        {tr("Eigene Namen und Notizen werden nicht übersetzt.")}
      </p>
      <p>
        {tr(
          "Eúzēn speichert dein Training in diesem Browser auf diesem Gerät. Es gibt noch keinen Cloud-Sync. Gelöschte Browserdaten können nicht wiederhergestellt werden – bewahre regelmäßig ein Backup auf.",
        )}
      </p>
      <div className="callout">
        <ShieldCheck size={20} />
        {tr(
          "Keine Werbetracker. Keine externen KI-Anfragen. Keine verbundenen Gesundheitsdienste.",
        )}
      </div>
      <div className="settings-counts">
        <span>
          {state.exercises.length}
          {tr(" Übungen")}
        </span>
        <span>
          {state.templates.length}
          {tr(" Workouts")}
        </span>
        <span>
          {state.sessions.length}
          {tr(" Sessions")}
        </span>
      </div>
      <button className="btn primary full" onClick={() => exportState(state)}>
        <ArrowDownToLine size={18} />
        {tr("JSON-Backup exportieren")}
      </button>
      <label className="btn full upload-label">
        <Upload size={18} />
        {tr("Backup zum Prüfen auswählen")}
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIncoming(null);
            setError("");
            try {
              if (file.size > 15_000_000) throw new Error();
              const parsed = parseBackup(await file.text());
              setIncoming(parsed);
            } catch {
              setError(
                "Das Backup ist ungültig, zu groß oder hat eine nicht unterstützte Version. Bestehende Daten wurden nicht verändert.",
              );
            }
            e.target.value = "";
          }}
        />
      </label>
      {incoming && (
        <div className="import-preview">
          <h3>{tr("Geprüftes Backup · Version 1")}</h3>
          <p>
            {incoming.templates.length}
            {tr(" Workouts, ")}
            {incoming.sessions.length} {tr("Sessions und ")}
            {incoming.scheduled.length}
            {tr(" Planeinträge.")}
          </p>
          <p>
            {tr(
              "Der Import ersetzt die lokalen Daten. Vorher wird automatisch ein Backup des aktuellen Stands heruntergeladen.",
            )}
          </p>
          <div className="button-row">
            <button className="btn" onClick={() => setIncoming(null)}>
              {tr("Abbrechen")}
            </button>
            <button
              className="btn primary"
              onClick={() => {
                exportState(state);
                update(() => incoming);
                setIncoming(null);
                setMessage("Backup übernommen.");
              }}
            >
              {tr("Backup herunterladen & ersetzen")}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {tr(error)}
        </p>
      )}
      {message && <p role="status">{tr(message)}</p>}
      <hr />
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={state.preferences.audio}
          onChange={(e) =>
            update((s) => ({
              ...s,
              preferences: { ...s.preferences, audio: e.target.checked },
            }))
          }
        />
        {tr("Optionale Timer-Töne aktivieren")}
      </label>
      <p className="hint">
        {tr(
          "Starte den Timer einmal per Klick, damit der Browser Audio freigeben kann. Signale im Hintergrund sind nicht garantiert.",
        )}
      </p>
      <details>
        <summary>
          <CircleHelp size={16} />
          {tr("Über dieses Grundgerüst")}
        </summary>
        <p>
          {tr(
            "Version 0.5 · Sprache Deutsch. Datenformat mit Schema-Versionierung. Vorlagen dienen der allgemeinen Trainingsplanung; passe sie an deine Erfahrung und deine Möglichkeiten an.",
          )}
        </p>
      </details>
    </Modal>
  );
}
