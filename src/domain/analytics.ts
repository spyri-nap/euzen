import {
  localDate,
  type AppState,
  type WorkoutSession,
  type SetResult,
} from "./model";

export function resultVolume(
  r: SetResult,
  session: WorkoutSession,
): number | null {
  const exercise = session.exercises.find((e) => e.id === r.exerciseId);
  return !r.skipped &&
    exercise?.metrics.includes("load") &&
    exercise.metrics.includes("reps") &&
    r.load > 0
    ? r.reps * r.load * r.implements
    : null;
}
export function summary(sessions: WorkoutSession[]) {
  const finished = sessions.filter((s) => s.status !== "active");
  const volumes = finished
    .flatMap((s) => s.results.map((r) => resultVolume(r, s)))
    .filter((n): n is number => n !== null);
  return {
    complete: finished.filter((s) => s.status === "complete").length,
    incomplete: finished.filter((s) => s.status === "incomplete").length,
    minutes: finished.reduce((n, s) => n + s.activeMs / 60000, 0),
    days: new Set(
      finished
        .filter((s) => s.results.some((r) => !r.skipped))
        .map((s) => localDate(new Date(s.startedAt))),
    ).size,
    volume: volumes.length ? volumes.reduce((a, b) => a + b, 0) : null,
    results: finished.flatMap((s) => s.results.filter((r) => !r.skipped))
      .length,
  };
}
export function coverage(
  sessions: WorkoutSession[],
  key: "dimension" | "pattern",
) {
  const counts: Record<string, number> = {};
  for (const s of sessions.filter((s) => s.status !== "active"))
    for (const r of s.results.filter((r) => !r.skipped)) {
      const e = s.exercises.find((e) => e.id === r.exerciseId);
      if (e) counts[e[key]] = (counts[e[key]] || 0) + 1;
    }
  return counts;
}
export function comparableKey(
  session: WorkoutSession,
  exerciseId: string,
  prescriptionId: string,
  blockId: string,
) {
  const e = session.exercises.find((e) => e.id === exerciseId);
  const b = session.snapshot.blocks.find((b) => b.id === blockId);
  const p = b?.exercises.find((p) => p.id === prescriptionId);
  return JSON.stringify([
    e?.id,
    e?.equipment,
    e?.metrics,
    b?.mode,
    b?.rounds,
    b?.work,
    b?.rest,
    b?.transition,
    b?.exercises.map((x) => x.exerciseId),
    b?.exercises.findIndex((x) => x.id === prescriptionId),
    p?.side,
    p?.implements,
    p?.tempo,
  ]);
}
export function previousResult(
  state: AppState,
  session: WorkoutSession,
  exerciseId: string,
  prescriptionId: string,
  blockId: string,
  round: number,
) {
  const key = comparableKey(session, exerciseId, prescriptionId, blockId);
  for (const old of state.sessions
    .filter((s) => s.status !== "active" && s.startedAt < session.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt)) {
    const r = old.results.find(
      (r) =>
        !r.skipped &&
        r.exerciseId === exerciseId &&
        r.round === round &&
        comparableKey(old, r.exerciseId, r.prescriptionId, r.blockId) === key,
    );
    if (r) return { result: r, date: localDate(new Date(old.startedAt)) };
  }
  return null;
}
/** Explicit read-only boundary for a future coach. No identifiers, notes or raw check-ins. */
export function coachContext(state: AppState) {
  return {
    source: "Eúzēn Trainingsprotokoll",
    period: "Gesamter gespeicherter Zeitraum",
    ...summary(state.sessions),
    dimensions: coverage(state.sessions, "dimension"),
    patterns: coverage(state.sessions, "pattern"),
  };
}
