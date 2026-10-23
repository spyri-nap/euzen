import { t as tr } from "../i18n";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Copy,
  Edit3,
  Leaf,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import {
  addDays,
  formatDate,
  localDate,
  monday,
  uid,
  type AppState,
  type ScheduledWorkout,
  type WorkoutTemplate,
} from "../domain/model";
import { estimateMinutes } from "../domain/timer";
import { Empty, Field, Modal } from "./common";

type Props = {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  onEdit: (t?: WorkoutTemplate) => void;
  onStart: (t: WorkoutTemplate, scheduledId?: string) => void;
};
export function Planning({ state, update, onEdit, onStart }: Props) {
  const [week, setWeek] = useState(monday());
  const [adding, setAdding] = useState<string | null>(null);
  const [preselected, setPreselected] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const plan = state.weeklyPlans.find((p) => p.startDate === week);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tr("DEIN PERSÖNLICHER RHYTHMUS")}</p>
          <h1>{tr("Raum für Bewegung.")}</h1>
          <p>{tr("Plane deine Woche so, wie sie zu deinem Leben passt.")}</p>
        </div>
        <button className="btn primary" onClick={() => onEdit()}>
          <Plus size={18} />
          {tr("Workout erstellen")}
        </button>
      </div>
      <section className="panel week-planner">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              {formatDate(week)} – {formatDate(addDays(week, 6))}
            </p>
            <h2>{tr("Deine Trainingswoche")}</h2>
          </div>
          <div className="button-row">
            <button
              className="icon-btn"
              aria-label={tr("Vorherige Woche")}
              onClick={() => {
                setWeek(addDays(week, -7));
                setCopied(false);
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <button className="btn small-btn" onClick={() => setWeek(monday())}>
              {tr("Heute")}
            </button>
            <button
              className="icon-btn"
              aria-label={tr("Nächste Woche")}
              onClick={() => {
                setWeek(addDays(week, 7));
                setCopied(false);
              }}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <Field label={tr("Name dieser Woche")}>
          <input
            maxLength={100}
            value={plan?.name ?? ""}
            placeholder={tr("z. B. Meine Balance-Woche")}
            onChange={(e) =>
              update((s) => ({
                ...s,
                weeklyPlans: plan
                  ? s.weeklyPlans.map((p) =>
                      p.id === plan.id
                        ? { ...p, name: e.target.value || "Meine Woche" }
                        : p,
                    )
                  : [
                      ...s.weeklyPlans,
                      {
                        id: uid(),
                        name: e.target.value || "Meine Woche",
                        startDate: week,
                      },
                    ],
              }))
            }
          />
        </Field>
        <div className="planner-days">
          {days.map((day) => (
            <div
              className={`planner-day ${day === localDate() ? "today" : ""}`}
              key={day}
            >
              <div className="planner-day-title">
                <span>{formatDate(day, { weekday: "short" })}</span>
                <strong>{formatDate(day, { day: "numeric" })}</strong>
                {day === localDate() && <small>{tr("Heute")}</small>}
              </div>
              {state.scheduled
                .filter((p) => p.date === day)
                .map((p) => {
                  const complete = state.sessions.some(
                    (s) => s.scheduledId === p.id && s.status === "complete",
                  );
                  const attempted = state.sessions.some(
                    (s) => s.scheduledId === p.id && s.status === "incomplete",
                  );
                  const template = state.templates.find(
                    (t) => t.id === p.templateId,
                  );
                  return (
                    <article
                      className={`schedule-item ${p.kind} ${complete ? "done" : ""}`}
                      key={p.id}
                    >
                      <span className="tag">
                        {complete
                          ? tr("Abgeschlossen")
                          : attempted
                            ? tr("Teilweise trainiert")
                            : day < localDate() && p.kind === "workout"
                              ? tr("Offen · vergangen")
                              : p.kind === "rest"
                                ? tr("Erholung")
                                : p.kind === "mobility"
                                  ? tr("Mobilität")
                                  : template?.dimension}
                      </span>
                      <h4>{p.label}</h4>
                      {template && (
                        <p>
                          {estimateMinutes(template)}
                          {tr(" Min. geschätzt")}
                        </p>
                      )}
                      <div className="schedule-actions">
                        {template && !complete && (
                          <button
                            className="icon-btn"
                            aria-label={`${p.label} starten`}
                            onClick={() => onStart(template, p.id)}
                          >
                            <Play size={15} />
                          </button>
                        )}
                        <button
                          className="icon-btn danger"
                          aria-label={`${p.label} aus Plan entfernen`}
                          onClick={() => setRemoving(p.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <label className="move-date">
                        {tr("Verschieben")}
                        <input
                          type="date"
                          aria-label={`${p.label} verschieben`}
                          value={p.date}
                          onChange={(e) => {
                            if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))
                              update((s) => ({
                                ...s,
                                scheduled: s.scheduled.map((x) =>
                                  x.id === p.id
                                    ? { ...x, date: e.target.value }
                                    : x,
                                ),
                              }));
                          }}
                        />
                      </label>
                    </article>
                  );
                })}
              <button
                className="add-day"
                aria-label={`Einheit am ${formatDate(day)} einplanen`}
                onClick={() => {
                  setPreselected(undefined);
                  setAdding(day);
                }}
              >
                <Plus size={17} />
                <span>{tr("Einplanen")}</span>
              </button>
            </div>
          ))}
        </div>
        <div className="section-foot">
          <span className="hint">
            {tr("Ein freier Tag darf frei bleiben.")}
          </span>
          <button
            className="btn small-btn"
            onClick={() => {
              const items = state.scheduled.filter(
                (p) => p.date >= week && p.date <= addDays(week, 6),
              );
              if (!items.length) return;
              update((s) => ({
                ...s,
                scheduled: [
                  ...s.scheduled,
                  ...items.map((p) => ({
                    ...p,
                    id: uid(),
                    date: addDays(p.date, 7),
                  })),
                ],
                weeklyPlans: s.weeklyPlans.some(
                  (p) => p.startDate === addDays(week, 7),
                )
                  ? s.weeklyPlans
                  : [
                      ...s.weeklyPlans,
                      {
                        id: uid(),
                        name: `${plan?.name ?? "Meine Woche"} · Kopie`,
                        startDate: addDays(week, 7),
                      },
                    ],
              }));
              setCopied(true);
            }}
            disabled={
              copied || !state.scheduled.some((p) => days.includes(p.date))
            }
          >
            <Copy size={15} />
            {copied
              ? tr("In Folgewoche kopiert")
              : tr("In Folgewoche kopieren")}
          </button>
        </div>
      </section>
      <div className="section-head section-gap">
        <div>
          <p className="eyebrow">{tr("DEIN BAUKASTEN")}</p>
          <h2>{tr("Deine Workouts")}</h2>
        </div>
        <span className="muted">
          {state.templates.length}
          {tr(" Vorlagen")}
        </span>
      </div>
      <div className="workout-grid">
        {state.templates.map((t, i) => (
          <article className="workout-card" key={t.id}>
            <div className={`workout-mark mark-${i % 3}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <Leaf size={34} strokeWidth={1} />
            </div>
            <div className="workout-body">
              <div className="tagline">
                {t.dimension}
                {tr(" · ca. ")}
                {estimateMinutes(t)}
                {tr(" Min.")}
              </div>
              <h3>{t.name}</h3>
              <p>{t.description || "Dein individuelles Training."}</p>
              <div className="tag-row">
                <span className="tag">
                  {t.blocks.length}
                  {tr(" Blöcke")}
                </span>
                <span className="tag">
                  {t.blocks.reduce((n, b) => n + b.exercises.length, 0)}
                  {tr(" Übungen")}
                </span>
                {t.sample && (
                  <span className="tag">{tr("Beispielvorlage")}</span>
                )}
              </div>
              <div className="workout-actions">
                <button className="btn primary" onClick={() => onStart(t)}>
                  <Play size={15} />
                  {tr("Starten")}
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${t.name} bearbeiten`}
                  onClick={() => onEdit(t)}
                >
                  <Edit3 size={18} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${t.name} duplizieren`}
                  onClick={() => {
                    const copy = structuredClone(t);
                    copy.id = uid();
                    copy.name = `${t.name} · Kopie`.slice(0, 100);
                    copy.sample = false;
                    copy.updatedAt = Date.now();
                    update((s) => ({
                      ...s,
                      templates: [...s.templates, copy],
                    }));
                  }}
                >
                  <Copy size={18} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={`${t.name} einplanen`}
                  onClick={() => {
                    setPreselected(t.id);
                    setAdding(localDate());
                  }}
                >
                  <CalendarDays size={18} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!state.templates.length && (
        <Empty
          title={tr("Dein erstes Workout wartet")}
          text={tr("Wähle Übungen und finde deinen eigenen Rhythmus.")}
          action={tr("Workout erstellen")}
          onAction={() => onEdit()}
        />
      )}
      {adding && (
        <ScheduleModal
          state={state}
          date={adding}
          preselected={preselected}
          onClose={() => setAdding(null)}
          onSave={(p) => {
            update((s) => ({ ...s, scheduled: [...s.scheduled, p] }));
            setAdding(null);
          }}
        />
      )}
      {removing && (
        <Modal
          title={tr("Eintrag aus dem Plan entfernen?")}
          onClose={() => setRemoving(null)}
        >
          <p>
            {tr("Bereits gespeicherte Trainingsergebnisse bleiben erhalten.")}
          </p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setRemoving(null)}>
              {tr("Behalten")}
            </button>
            <button
              className="btn primary"
              onClick={() => {
                update((s) => ({
                  ...s,
                  scheduled: s.scheduled.filter((p) => p.id !== removing),
                }));
                setRemoving(null);
              }}
            >
              {tr("Eintrag entfernen")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function ScheduleModal({
  state,
  date,
  preselected,
  onClose,
  onSave,
}: {
  state: AppState;
  date: string;
  preselected?: string;
  onClose: () => void;
  onSave: (p: ScheduledWorkout) => void;
}) {
  const [day, setDay] = useState(date);
  const [kind, setKind] = useState<ScheduledWorkout["kind"]>("workout");
  const [templateId, setTemplate] = useState(
    preselected ?? state.templates[0]?.id ?? "",
  );
  return (
    <Modal title={tr("Zeit für Bewegung einplanen")} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = state.templates.find((t) => t.id === templateId);
          onSave({
            id: uid(),
            date: day,
            kind,
            templateId: kind === "workout" ? templateId : null,
            label:
              kind === "rest"
                ? "Zeit zum Erholen"
                : kind === "mobility"
                  ? "Freie Mobility-Pause"
                  : t!.name,
          });
        }}
      >
        <Field label={tr("Datum")}>
          <input
            type="date"
            required
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </Field>
        <Field label={tr("Was möchtest du einplanen?")}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="workout">{tr("Workout")}</option>
            <option value="rest">{tr("Ruhetag")}</option>
            <option value="mobility">
              {tr("Freie Mobility-Pause (ohne Protokoll)")}
            </option>
          </select>
        </Field>
        {kind === "workout" && (
          <Field label={tr("Workout")}>
            <select
              required
              value={templateId}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {state.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="modal-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={kind === "workout" && !templateId}
          >
            {tr("Einplanen")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
