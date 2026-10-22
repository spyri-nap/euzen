import {
  addDays,
  localDate,
  modeLabels,
  type AppState,
  type WorkoutSession,
} from "./model";
import { comparableKey, coverage, resultVolume, summary } from "./analytics";

/** Inclusive local calendar windows; deliberately not elapsed 24-hour durations. */
export function periodSessions(
  sessions: WorkoutSession[],
  days: number,
  end = localDate(),
) {
  const start = addDays(end, 1 - days);
  return sessions.filter((s) => {
    const date = localDate(new Date(s.startedAt));
    return s.status !== "active" && date >= start && date <= end;
  });
}

export function periodComparison(
  sessions: WorkoutSession[],
  days: number,
  end = localDate(),
) {
  const current = periodSessions(sessions, days, end);
  const previous = periodSessions(sessions, days, addDays(end, -days));
  return {
    start: addDays(end, 1 - days),
    end,
    previousStart: addDays(end, 1 - days * 2),
    previousEnd: addDays(end, -days),
    current: summary(current),
    previous: summary(previous),
    currentCount: current.length,
    previousCount: previous.length,
  };
}

export function difference(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return {
    absolute: current - previous,
    percent: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
}

export type TrendMetric = "volume" | "reps" | "seconds" | "distance" | "rpe";
export type TrendPoint = {
  sessionId: string;
  startedAt: number;
  date: string;
  confirmed: number;
  expected: number;
  volume: number | null;
  reps: number | null;
  seconds: number | null;
  distance: number | null;
  rpe: number | null;
  rpeCount: number;
  counts: Record<TrendMetric, number>;
};
export type TrendSeries = {
  key: string;
  name: string;
  description: string;
  points: TrendPoint[];
};

/** Snapshot-based series: never combine equipment, sides, protocols or tempos. */
export function exerciseTrends(sessions: WorkoutSession[]): TrendSeries[] {
  const series = new Map<string, TrendSeries>();
  for (const session of sessions
    .filter((s) => s.status !== "active")
    .sort((a, b) => a.startedAt - b.startedAt)) {
    const grouped = new Map<string, typeof session.results>();
    for (const result of session.results.filter(
      (r) => !r.skipped && !r.pendingConfirmation,
    )) {
      const key = comparableKey(
        session,
        result.exerciseId,
        result.prescriptionId,
        result.blockId,
      );
      // Equal-looking blocks remain separate within and across template snapshots.
      const seriesKey = JSON.stringify([
        key,
        result.blockId,
        result.prescriptionId,
        result.implements,
        session.snapshot.blocks.find((b) => b.id === result.blockId)?.guided,
      ]);
      grouped.set(seriesKey, [...(grouped.get(seriesKey) ?? []), result]);
    }
    for (const [key, results] of grouped) {
      const first = results[0];
      const exercise = session.exercises.find((e) => e.id === first.exerciseId);
      const block = session.snapshot.blocks.find((b) => b.id === first.blockId);
      const prescription = block?.exercises.find(
        (p) => p.id === first.prescriptionId,
      );
      if (!exercise || !block || !prescription) continue;
      const volumes = results
        .map((r) => resultVolume(r, session))
        .filter((v): v is number => v !== null);
      const effort = results
        .map((r) => r.rpe)
        .filter((v): v is number => v !== null);
      const distances = results
        .map((r) => r.distance)
        .filter((v): v is number => v !== null);
      const expected = session.phases.filter(
        (p) =>
          p.kind === "work" &&
          p.blockId === first.blockId &&
          p.prescriptionId === first.prescriptionId,
      ).length;
      const point: TrendPoint = {
        sessionId: session.id,
        startedAt: session.startedAt,
        date: localDate(new Date(session.startedAt)),
        confirmed: results.length,
        expected,
        volume: volumes.length ? volumes.reduce((a, b) => a + b, 0) : null,
        reps: exercise.metrics.includes("reps")
          ? results.reduce((n, r) => n + r.reps, 0)
          : null,
        seconds: exercise.metrics.includes("time")
          ? results.reduce((n, r) => n + r.seconds, 0)
          : null,
        distance:
          exercise.metrics.includes("distance") && distances.length
            ? distances.reduce((a, b) => a + b, 0)
            : null,
        rpe: effort.length
          ? effort.reduce((a, b) => a + b, 0) / effort.length
          : null,
        rpeCount: effort.length,
        counts: {
          volume: volumes.length,
          reps: exercise.metrics.includes("reps") ? results.length : 0,
          seconds: exercise.metrics.includes("time") ? results.length : 0,
          distance: exercise.metrics.includes("distance")
            ? distances.length
            : 0,
          rpe: effort.length,
        },
      };
      if (!series.has(key))
        series.set(key, {
          key,
          name: exercise.name,
          description: `${exercise.equipment} · ${prescription.side} · ${first.implements} Gewicht(e) · ${block.name} · ${modeLabels[block.mode]} · ${block.rounds} Runde(n) · ${block.work} s Arbeit / ${block.rest} s Pause / ${block.transition} s Übergang · ${block.guided ? "automatisch" : "manuell"} · Tempo ${prescription.tempo || "frei"}`,
          points: [],
        });
      series.get(key)!.points.push(point);
    }
  }
  return [...series.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
}

export function trendComparison(points: TrendPoint[], metric: TrendMetric) {
  const valid = points.filter(
    (p) =>
      p.confirmed === p.expected &&
      p.expected > 0 &&
      p[metric] !== null &&
      p.counts[metric] === p.confirmed,
  );
  return valid.length >= 2
    ? { previous: valid[valid.length - 2], last: valid[valid.length - 1] }
    : null;
}

export function weeklyReview(state: AppState, end = localDate()) {
  const sessions = periodSessions(state.sessions, 7, end);
  const comparison = periodComparison(state.sessions, 7, end);
  const patterns = coverage(sessions, "pattern");
  const pending = sessions
    .flatMap((s) => s.results)
    .filter((r) => r.pendingConfirmation).length;
  const start = addDays(end, -6);
  const checkins = state.checkins.filter(
    (c) => c.date >= start && c.date <= end,
  );
  return {
    ...comparison,
    pending,
    patterns,
    checkins: checkins.length,
    energy: checkins.length
      ? checkins.reduce((n, c) => n + c.energy, 0) / checkins.length
      : null,
    recovery: checkins.length
      ? checkins.reduce((n, c) => n + c.recovery, 0) / checkins.length
      : null,
  };
}
