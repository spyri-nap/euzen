import { useState } from "react";
import {
  difference,
  exerciseTrends,
  periodComparison,
  weeklyReview,
  trendComparison,
  type TrendMetric,
} from "../domain/insights";
import {
  formatDate,
  number,
  type AppState,
  type WorkoutSession,
} from "../domain/model";

function Delta({
  current,
  previous,
  unit = "",
}: {
  current: number | null;
  previous: number | null;
  unit?: string;
}) {
  const delta = difference(current, previous);
  if (!delta) return <span className="hint">Kein Zahlenvergleich möglich</span>;
  return (
    <span className="period-delta">
      {delta.absolute > 0 ? "+" : ""}
      {number(delta.absolute, 1)} {unit}
      {delta.percent !== null
        ? ` (${delta.percent > 0 ? "+" : ""}${number(delta.percent, 0)} %)`
        : " · keine Prozentbasis"}
    </span>
  );
}

export function PeriodComparison({
  sessions,
  days,
}: {
  sessions: WorkoutSession[];
  days: number;
}) {
  const data = periodComparison(sessions, days);
  const metrics = [
    { label: "Abgeschlossene Workouts", key: "complete", unit: "" },
    { label: "Trainingszeit inkl. Pausen", key: "minutes", unit: "min" },
    { label: "Aktive Trainingstage", key: "days", unit: "" },
    { label: "Protokollierte Volumenlast", key: "volume", unit: "kg" },
  ] as const;
  return (
    <section className="panel section-gap">
      <p className="eyebrow">GLEICHE ZEITRÄUME, KLARER KONTEXT</p>
      <h2>Dein Zeitraumvergleich</h2>
      <p className="hint">
        {formatDate(data.start)} – {formatDate(data.end)} gegenüber{" "}
        {formatDate(data.previousStart)} – {formatDate(data.previousEnd)}. Je{" "}
        {days} Kalendertage; heute ist noch nicht abgeschlossen.
      </p>
      {!data.previousCount && (
        <p className="callout">
          Im vorherigen Zeitraum liegen keine beendeten Einheiten vor. Fehlende
          Aufzeichnungen bedeuten nicht, dass du nicht trainiert hast.
        </p>
      )}
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Zeitraumvergleich horizontal scrollbar"
      >
        <table className="insights-table" aria-label="Zeitraumvergleich">
          <thead>
            <tr>
              <th>Kennzahl</th>
              <th>Aktuell</th>
              <th>Davor</th>
              <th>Veränderung</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label}</th>
                <td>
                  {data.current[m.key] === null
                    ? "—"
                    : number(data.current[m.key]!, 1)}{" "}
                  {m.unit}
                </td>
                <td>
                  {!data.previousCount || data.previous[m.key] === null
                    ? "—"
                    : `${number(data.previous[m.key]!, 1)} ${m.unit}`}
                </td>
                <td>
                  {data.previousCount && data.currentCount ? (
                    <Delta
                      current={data.current[m.key]}
                      previous={data.previous[m.key]}
                      unit={m.unit}
                    />
                  ) : (
                    <span className="hint">Noch keine Vergleichsbasis</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Mehr ist nicht automatisch besser. Volumenlast vergleicht nur erfasste
        externe Last × Wiederholungen × Gewichteanzahl, nicht Trainingsqualität.
        Fehlende Lastdaten sind kein Nullwert.
      </p>
    </section>
  );
}

const metricLabels: Record<TrendMetric, { label: string; unit: string }> = {
  volume: { label: "Volumenlast", unit: "kg" },
  reps: { label: "Wiederholungen", unit: "Reps" },
  seconds: { label: "Protokollierte Arbeitszeit", unit: "s" },
  distance: { label: "Distanz", unit: "m" },
  rpe: { label: "Mittlere Satz-RPE", unit: "/ 10" },
};
export function ExerciseTrends({
  sessions,
  onSession,
}: {
  sessions: WorkoutSession[];
  onSession: (s: WorkoutSession) => void;
}) {
  const series = exerciseTrends(sessions);
  const [key, setKey] = useState("");
  const [metric, setMetric] = useState<TrendMetric>("volume");
  const selected = series.find((s) => s.key === key) ?? series[0];
  const available = selected
    ? (Object.keys(metricLabels) as TrendMetric[]).filter((k) =>
        selected.points.some((p) => p[k] !== null),
      )
    : [];
  const activeMetric = available.includes(metric)
    ? metric
    : (available[0] ?? "reps");
  const label = metricLabels[activeMetric];
  const points = selected?.points ?? [];
  const comparison = trendComparison(points, activeMetric);
  const last = comparison?.last,
    previous = comparison?.previous;
  const max = Math.max(1, ...points.map((p) => p[activeMetric] ?? 0));
  return (
    <section className="panel section-gap">
      <p className="eyebrow">DEINE PERSÖNLICHEN REFERENZPUNKTE</p>
      <h2>Eine Übung. Dein Verlauf.</h2>
      {!selected ? (
        <p>
          Noch keine bestätigten Übungsergebnisse in diesem Zeitraum. Nach
          deinem ersten Protokoll kannst du hier Varianten und Messwerte
          auswählen.
        </p>
      ) : (
        <>
          <div className="insight-controls">
            <label>
              Übung & Protokoll
              <select
                aria-label="Übung und Protokoll"
                value={selected.key}
                onChange={(e) => setKey(e.target.value)}
              >
                {series.map((s, i) => (
                  <option key={s.key} value={s.key}>
                    {s.name} · Protokoll {i + 1} ({s.points.length}{" "}
                    {s.points.length === 1 ? "Einheit" : "Einheiten"})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Messwert
              <select
                aria-label="Verlaufsmesswert"
                value={activeMetric}
                disabled={!available.length}
                onChange={(e) => setMetric(e.target.value as TrendMetric)}
              >
                {!available.length && (
                  <option value="reps">Noch keine geeigneten Messwerte</option>
                )}
                {available.map((m) => (
                  <option value={m} key={m}>
                    {metricLabels[m].label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="hint">{selected.description}</p>
          <p>
            {previous && last ? (
              <>
                Letzte zwei vollständig protokollierte Einheiten:{" "}
                <Delta
                  current={last[activeMetric]}
                  previous={previous[activeMetric]}
                  unit={label.unit}
                />{" "}
                ({formatDate(previous.date)} → {formatDate(last.date)})
              </>
            ) : (
              "Für einen Vergleich fehlen zwei vollständig protokollierte Einheiten mit diesem Messwert."
            )}
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Übungsverlauf horizontal scrollbar"
          >
            <table
              className="insights-table trend-table"
              aria-label="Übungsverlauf"
            >
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>{available.length ? label.label : "Messwert"}</th>
                  <th>Protokoll</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.sessionId}>
                    <th scope="row">
                      {formatDate(p.date, {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </th>
                    <td>
                      <div className="trend-value">
                        <span>
                          {p[activeMetric] === null
                            ? "—"
                            : `${number(p[activeMetric]!, 1)} ${label.unit}`}
                        </span>
                        <i
                          aria-hidden="true"
                          style={{
                            width: `${((p[activeMetric] ?? 0) / max) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      {p.confirmed}/{p.expected} bestätigt
                      {` · ${p.counts[activeMetric]}/${p.confirmed} Messwerte`}
                    </td>
                    <td>
                      <button
                        className="btn small"
                        onClick={() => {
                          const session = sessions.find(
                            (s) => s.id === p.sessionId,
                          );
                          if (session) onSession(session);
                        }}
                      >
                        Ansehen
                        <span className="sr-only">
                          : Training vom {formatDate(p.date)}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">
            Getrennt nach Übung, Equipment, Seite, Gewichteanzahl, Tempo und
            Blockprotokoll. Nur dieselbe Vorlage mit unveränderten
            Protokollparametern wird verbunden. Teilprotokolle bleiben sichtbar,
            zählen aber nicht zum Vergleich. Der Messwert muss für jeden
            Arbeitsschritt vorliegen. RPE ist subjektive Satzanstrengung, kein
            objektiver Intensitätswert.
          </p>
        </>
      )}
    </section>
  );
}

export function WeeklyReview({
  state,
  onPlan,
}: {
  state: AppState;
  onPlan?: () => void;
}) {
  const review = weeklyReview(state);
  return (
    <section className="panel weekly-review section-gap">
      <p className="eyebrow">PERSÖNLICHER WOCHENRÜCKBLICK</p>
      <h2>Deine letzten sieben Tage.</h2>
      <p className="hint">
        {formatDate(review.start)} – {formatDate(review.end)} · lokal und
        regelbasiert, keine KI oder medizinische Bewertung.
      </p>
      <div className="review-facts">
        <div>
          <strong>{review.current.complete}</strong>
          <span>abgeschlossene Einheiten</span>
        </div>
        <div>
          <strong>{review.current.days}</strong>
          <span>aktive Trainingstage</span>
        </div>
        <div>
          <strong>{number(review.current.minutes, 1)} min</strong>
          <span>Trainingszeit inkl. Pausen</span>
        </div>
      </div>
      <p>
        {review.currentCount
          ? `${review.current.incomplete} unvollständige Einheiten. Erfasste Bewegungsmuster in bestätigten Ergebnissen: ${Object.keys(review.patterns).length}.`
          : "Noch keine beendeten Einheiten in den letzten sieben Tagen. Du kannst mit einem passenden Workout beginnen oder bewusst Erholung einplanen."}
      </p>
      {review.previousCount > 0 && (
        <p>
          Abgeschlossene Einheiten gegenüber den sieben Tagen davor:{" "}
          <Delta
            current={review.current.complete}
            previous={review.previous.complete}
          />
          . Das ist eine Beschreibung, kein Leistungsurteil.
        </p>
      )}
      {review.pending > 0 && (
        <p className="callout">
          {review.pending} Zeitfenster warten auf Bestätigung. Ergänze im
          Fortschritt die tatsächlichen Ergebnisse, bevor du daraus Leistung
          ableitest.
        </p>
      )}
      <p>
        {review.checkins
          ? `Deine ${review.checkins} Tages-Check-ins: Energie Ø ${number(review.energy!, 1)}/5, Erholung Ø ${number(review.recovery!, 1)}/5. Subjektive Momentaufnahmen, keine Aussage über Trainingsbereitschaft.`
          : "Noch keine Tages-Check-ins in diesem Zeitraum. Optional kannst du auf „Heute“ Energie und Erholung festhalten."}
      </p>
      <p className="hint">
        Reflexionsfrage: Was hat sich gut angefühlt – und was möchtest du in der
        nächsten Woche bewusst beibehalten oder anpassen? Außerhalb der App
        absolvierte Bewegung ist unbekannt.
      </p>
      {onPlan && (
        <button className="btn" onClick={onPlan}>
          Wochenplan gestalten
        </button>
      )}
    </section>
  );
}
