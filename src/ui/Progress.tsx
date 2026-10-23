import { t as tr } from "../i18n";
import { useState } from "react";
import { ArrowUpRight, Check, Clock3, Dumbbell, Activity } from "lucide-react";
import {
  addDays,
  dimensions,
  formatDate,
  localDate,
  number,
  type AppState,
  type WorkoutSession,
  type SetResult,
  resultSchema,
} from "../domain/model";
import {
  coverage,
  previousResult,
  resultVolume,
  summary,
} from "../domain/analytics";
import { Empty, Modal, Field, Num } from "./common";
import { ExerciseTrends, PeriodComparison, WeeklyReview } from "./Insights";

export function Progress({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
}) {
  const [editing, setEditing] = useState<SetResult | null>(null);
  const [period, setPeriod] = useState("all");
  const [detail, setDetail] = useState<WorkoutSession | null>(null);
  const cutoff =
    period === "all" ? "" : addDays(localDate(), -Number(period) + 1);
  const sessions = state.sessions.filter(
    (s) =>
      s.status !== "active" &&
      (!cutoff || localDate(new Date(s.startedAt)) >= cutoff) &&
      localDate(new Date(s.startedAt)) <= localDate(),
  );
  const stats = summary(sessions);
  const distribution = coverage(sessions, "dimension");
  const patternCounts = coverage(sessions, "pattern");
  const max = Math.max(...Object.values(distribution), 1);
  const planned = state.scheduled.filter(
    (p) =>
      p.kind === "workout" &&
      (!cutoff || p.date >= cutoff) &&
      p.date <= localDate(),
  ).length;
  const linked = state.scheduled.filter(
    (p) =>
      p.kind === "workout" &&
      (!cutoff || p.date >= cutoff) &&
      p.date <= localDate() &&
      state.sessions.some(
        (s) => s.scheduledId === p.id && s.status === "complete",
      ),
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tr("DEIN WEG IN BEWEGUNG")}</p>
          <h1>{tr("Fortschritt hat viele Formen.")}</h1>
          <p>
            {tr("Verstehe deinen Rhythmus. Ein Training nach dem anderen.")}
          </p>
        </div>
        <label className="filter">
          <select
            aria-label={tr("Auswertungszeitraum")}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="all">{tr("Gesamter Zeitraum")}</option>
            <option value="7">{tr("Letzte 7 Tage")}</option>
            <option value="28">{tr("Letzte 28 Tage")}</option>
            <option value="56">{tr("Letzte 56 Tage")}</option>
          </select>
        </label>
      </div>
      <div className="stats-grid">
        <Stat
          icon={<Check size={19} />}
          value={String(stats.complete)}
          label={tr("Abgeschlossene Workouts")}
          detail={`${stats.incomplete} unvollständig`}
        />
        <Stat
          icon={<Clock3 size={19} />}
          value={`${number(stats.minutes, 1)} min`}
          label={tr("Trainingszeit")}
          detail="inkl. laufender Pausen"
        />
        <Stat
          icon={<Activity size={19} />}
          value={String(stats.days)}
          label={tr("Aktive Trainingstage")}
          detail={`${stats.results} Arbeitsschritte`}
        />
        <Stat
          icon={<Dumbbell size={19} />}
          value={stats.volume === null ? "—" : `${number(stats.volume)} kg`}
          label={tr("Protokollierte Volumenlast")}
          detail="nur geeignete Last × Reps"
        />
      </div>
      {period !== "all" && (
        <PeriodComparison sessions={state.sessions} days={Number(period)} />
      )}
      <ExerciseTrends sessions={sessions} onSession={setDetail} />
      <WeeklyReview state={state} />
      {sessions.length ? (
        <>
          <div className="two-col section-gap">
            <section className="panel">
              <p className="eyebrow">{tr("DEIN BEWEGUNGSPROFIL")}</p>
              <h2>{tr("Was du trainiert hast")}</h2>
              <p className="hint">
                {tr(
                  "Protokollierte Arbeitsschritte nach Dimension. Dauer und Belastung können sich unterscheiden.",
                )}
              </p>
              <div className="bars">
                {dimensions.map((d) => (
                  <div className="bar-row" key={tr(d)}>
                    <span>{tr(d)}</span>
                    <div>
                      <i
                        style={{
                          width: `${((distribution[d] || 0) / max) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{distribution[d] || 0}</strong>
                  </div>
                ))}
              </div>
              <div className="tag-row">
                {Object.entries(patternCounts).map(([key, value]) => (
                  <span className="tag" key={key}>
                    {key} · {value}
                  </span>
                ))}
              </div>
            </section>
            <section className="panel rhythm-panel">
              <p className="eyebrow">{tr("KONSISTENZ")}</p>
              <h2>{tr("Deine eingeplanten Einheiten")}</h2>
              <div className="big-ratio">
                {linked}
                <span> / {planned}</span>
              </div>
              <p>
                {tr(
                  "Bis heute fällige Einträge im Plan, davon vollständig abgeschlossen. Ungeplante Workouts zählen zusätzlich in deiner Gesamtbilanz.",
                )}
              </p>
              <div className="callout">
                {tr(
                  "Jede Einheit ist ein neuer Referenzpunkt. Für sinnvolle Vergleiche bleiben Übung, Variante und Protokoll möglichst ähnlich.",
                )}
              </div>
            </section>
          </div>
          <div className="section-head section-gap">
            <h2>{tr("Deine Trainingsgeschichte")}</h2>
            <span className="muted">{tr("Neueste zuerst")}</span>
          </div>
          <div className="history-list">
            {[...sessions]
              .sort((a, b) => b.startedAt - a.startedAt)
              .map((s) => {
                const summaryData = summary([s]);
                return (
                  <button
                    className="history-row"
                    key={s.id}
                    onClick={() => setDetail(s)}
                  >
                    <span className={`history-icon ${s.status}`}>
                      <Check size={20} />
                    </span>
                    <span>
                      <strong>{s.snapshot.name}</strong>
                      <small>
                        {formatDate(localDate(new Date(s.startedAt)))} ·{" "}
                        {s.status === "complete"
                          ? tr("Abgeschlossen")
                          : tr("Unvollständig")}
                      </small>
                    </span>
                    <span className="history-value">
                      {number(summaryData.minutes, 1)}
                      {tr(" Min.")}
                      <small>
                        {s.results.filter((r) => !r.skipped).length}{" "}
                        {tr("Arbeitsschritte")}
                      </small>
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                );
              })}
          </div>
        </>
      ) : (
        <Empty
          title={tr("Hier wächst deine Geschichte.")}
          text={tr(
            "Nach deinem ersten Training siehst du echte Ergebnisse und persönliche Referenzpunkte. Auch eine unvollständige Einheit zählt zu deiner Geschichte.",
          )}
        />
      )}
      <p className="footnote">
        {tr(
          "Volumenlast = Zusatzgewicht je Gewicht × Anzahl der Gewichte × tatsächliche Wiederholungen. Keine Körpergewichts-Schätzungen. „—“ bedeutet: keine geeigneten Daten.",
        )}
      </p>
      {detail && (
        <Modal
          title={detail.snapshot.name}
          onClose={() => setDetail(null)}
          wide
        >
          <p className="eyebrow">
            {formatDate(localDate(new Date(detail.startedAt)))} ·{" "}
            {detail.status === "complete"
              ? tr("Abgeschlossen")
              : tr("Unvollständig")}
          </p>
          <div className="result-list">
            {detail.results.map((r) => {
              const e = detail.exercises.find((e) => e.id === r.exerciseId)!;
              const previous = previousResult(
                state,
                detail,
                r.exerciseId,
                r.prescriptionId,
                r.blockId,
                r.round,
              );
              const volume = resultVolume(r, detail);
              return (
                <div className="result-item" key={r.id}>
                  <h4>
                    {e.name}{" "}
                    <span className="muted">
                      {tr("· Durchgang ")}
                      {r.round}
                    </span>
                  </h4>
                  <button
                    className="btn small-btn"
                    onClick={() => setEditing(r)}
                  >
                    {tr("Ergebnis korrigieren")}
                  </button>
                  {r.skipped ? (
                    <p>
                      {r.pendingConfirmation
                        ? tr(
                            "Zeitfenster beendet · tatsächliche Ausführung noch bestätigen",
                          )
                        : tr("Übersprungen")}
                    </p>
                  ) : (
                    <>
                      <p>
                        {e.metrics.includes("reps")
                          ? `${r.reps} Reps · `
                          : tr("")}
                        {r.load > 0
                          ? `${r.implements} × ${r.load} kg · `
                          : tr("")}
                        {r.seconds}
                        {tr(" Sek.")}
                        {r.distance !== null ? ` · ${r.distance} m` : tr("")}
                        {volume !== null
                          ? ` · ${number(volume)} kg Volumenlast`
                          : tr("")}
                        {r.rpe !== null ? ` · RPE ${r.rpe}` : tr("")}
                        {r.rir !== null ? ` · RIR ${r.rir}` : tr("")}
                      </p>
                      {previous ? (
                        <p className="comparison">
                          {tr("Vergleich ")}
                          {formatDate(previous.date)}: {previous.result.reps}
                          {tr(" Reps")}
                          {previous.result.load
                            ? ` · ${previous.result.load} kg`
                            : tr("")}
                          {previous.result.rpe !== null
                            ? ` · RPE ${previous.result.rpe}`
                            : tr("")}
                          {tr(". Aktuell")}{" "}
                          {r.reps - previous.result.reps >= 0
                            ? tr("+")
                            : tr("")}
                          {r.reps - previous.result.reps}
                          {tr(" Reps bei")}{" "}
                          {r.load === previous.result.load
                            ? tr("gleicher")
                            : tr("veränderter")}{" "}
                          {tr("Last.")}
                        </p>
                      ) : (
                        <p className="hint">
                          {tr(
                            "Keine frühere Einheit mit vergleichbarem Protokoll.",
                          )}
                        </p>
                      )}
                      {r.notes && <p>{r.notes}</p>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {detail.notes && <div className="callout">{detail.notes}</div>}
        </Modal>
      )}
      {editing && detail && (
        <Correction
          result={editing}
          onClose={() => setEditing(null)}
          onSave={(result) => {
            const changed = {
              ...detail,
              results: detail.results.map((r) =>
                r.id === result.id ? result : r,
              ),
            };
            if (
              changed.results.length ===
                changed.phases.filter((p) => p.kind === "work").length &&
              changed.results.every((r) => !r.skipped && !r.pendingConfirmation)
            )
              changed.status = "complete";
            else changed.status = "incomplete";
            update((s) => ({
              ...s,
              sessions: s.sessions.map((x) =>
                x.id === changed.id ? changed : x,
              ),
            }));
            setDetail(changed);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
function Correction({
  result,
  onSave,
  onClose,
}: {
  result: SetResult;
  onSave: (r: SetResult) => void;
  onClose: () => void;
}) {
  const [draft, set] = useState(result);
  const [error, setError] = useState("");
  return (
    <Modal title={tr("Trainingsergebnis korrigieren")} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const checked = resultSchema.safeParse(draft);
          if (!checked.success) {
            setError("Bitte prüfe die Zahlen und Wertebereiche.");
            return;
          }
          const saved = checked.data;
          if (result.pendingConfirmation && !saved.pendingConfirmation)
            saved.notes = saved.notes
              .replace(
                "Zeitfenster abgelaufen. Tatsächliche Ausführung noch bestätigen.",
                "",
              )
              .trim();
          onSave(saved);
        }}
      >
        <p>
          {tr(
            "Die Auswertung wird neu berechnet. Die ursprüngliche Workout-Vorlage bleibt erhalten.",
          )}
        </p>
        {(result.pendingConfirmation || result.skipped) && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={!draft.skipped}
              onChange={(e) =>
                set({
                  ...draft,
                  skipped: !e.target.checked,
                  pendingConfirmation:
                    !e.target.checked && result.pendingConfirmation,
                })
              }
            />
            {tr("Ich habe diesen Arbeitsschritt tatsächlich absolviert.")}
          </label>
        )}
        <Num
          label={tr("Tatsächliche Reps")}
          value={draft.reps}
          max={100000}
          onChange={(reps) => set({ ...draft, reps })}
        />
        <Num
          label={tr("kg je Gewicht")}
          value={draft.load}
          step={0.5}
          onChange={(load) => set({ ...draft, load })}
        />
        <Num
          label={tr("Dauer (Sekunden)")}
          value={draft.seconds}
          max={86400}
          onChange={(seconds) => set({ ...draft, seconds })}
        />
        {(["rpe", "rir"] as const).map((key) => (
          <Field label={key.toUpperCase()} key={key}>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={draft[key] ?? ""}
              onChange={(e) =>
                set({
                  ...draft,
                  [key]: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </Field>
        ))}
        <Field label={tr("Notiz")}>
          <textarea
            value={draft.notes}
            maxLength={2000}
            onChange={(e) => set({ ...draft, notes: e.target.value })}
          />
        </Field>
        {error && <p role="alert">{tr(error)}</p>}
        <div className="modal-actions">
          <button className="btn primary" type="submit">
            {tr("Korrektur speichern")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Stat({
  icon,
  value,
  label,
  detail,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <article className="stat">
      <div className="stat-top">
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
