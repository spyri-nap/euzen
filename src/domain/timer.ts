import {
  uid,
  type Phase,
  type Timer,
  type WorkoutTemplate,
  type WorkoutSession,
  type Exercise,
} from "./model";

export function elapsed(timer: Timer, now: number) {
  return (
    timer.elapsedMs +
    (timer.status === "running" && timer.startedAt !== null
      ? Math.max(0, now - timer.startedAt)
      : 0)
  );
}
export function start(timer: Timer, now: number): Timer {
  return timer.status === "running" || timer.status === "expired"
    ? timer
    : { ...timer, status: "running", startedAt: now };
}
export function pause(timer: Timer, now: number): Timer {
  return timer.status !== "running"
    ? timer
    : {
        ...timer,
        status: "paused",
        elapsedMs: elapsed(timer, now),
        startedAt: null,
      };
}
export function freshTimer(): Timer {
  return { status: "idle", startedAt: null, elapsedMs: 0, extensionMs: 0 };
}
export function settle(
  timer: Timer,
  duration: number,
  manual: boolean,
  now: number,
): Timer {
  const target = duration * 1000 + timer.extensionMs;
  return !manual && timer.status === "running" && elapsed(timer, now) >= target
    ? { ...timer, status: "expired", startedAt: null, elapsedMs: target }
    : timer;
}
export function extend(timer: Timer, seconds: number, now: number): Timer {
  return {
    ...pause(timer, now),
    extensionMs: Math.min(86400000, timer.extensionMs + seconds * 1000),
    status: "paused",
    startedAt: null,
  };
}

export function compilePhases(template: WorkoutTemplate): Phase[] {
  const phases: Phase[] = [];
  for (const b of template.blocks) {
    const rounds = b.mode === "amrap" ? 1 : b.rounds;
    for (let r = 1; r <= rounds; r++) {
      for (let i = 0; i < b.exercises.length; i++) {
        const p = b.exercises[i];
        const base = {
          blockId: b.id,
          prescriptionId: p.id,
          exerciseId: p.exerciseId,
          round: r,
        };
        phases.push({
          ...base,
          id: `${b.id}:${r}:${p.id}:work`,
          kind: "work",
          duration: b.work,
          manual: b.mode === "sets" || b.mode === "rounds",
        });
        const last = r === rounds && i === b.exercises.length - 1;
        if (!last && b.mode !== "emom" && b.mode !== "amrap") {
          const isRoundEnd = i === b.exercises.length - 1 || b.mode === "sets";
          const duration = isRoundEnd ? b.rest : b.transition;
          if (duration)
            phases.push({
              ...base,
              id: `${b.id}:${r}:${p.id}:rest`,
              kind: isRoundEnd ? "rest" : "transition",
              duration,
              manual: false,
            });
        }
      }
    }
  }
  // Traditional sets finish A1,A2,... before B1,B2. Existing session snapshots
  // keep their compiled phases and therefore retain their original sequence.
  return template.blocks.flatMap((b) => {
    const own = phases.filter((p) => p.blockId === b.id);
    return b.mode === "sets"
      ? b.exercises.flatMap((e) => own.filter((p) => p.prescriptionId === e.id))
      : own;
  });
}
export function newSession(
  template: WorkoutTemplate,
  exercises: Exercise[],
  scheduledId: string | null,
): WorkoutSession {
  const now = Date.now();
  const snapshot = structuredClone(template);
  const ids = new Set(
    snapshot.blocks.flatMap((b) => b.exercises.map((p) => p.exerciseId)),
  );
  return {
    id: uid(),
    scheduledId,
    snapshot,
    exercises: structuredClone(exercises.filter((e) => ids.has(e.id))),
    phases: compilePhases(snapshot),
    phaseIndex: 0,
    startedAt: now,
    finishedAt: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: "active",
    results: [],
    timer: freshTimer(),
    activeMs: 0,
    activeSince: null,
    notes: "",
    draft: null,
  };
}
export function activeDuration(s: WorkoutSession, now: number) {
  return (
    s.activeMs + (s.activeSince !== null ? Math.max(0, now - s.activeSince) : 0)
  );
}
export function finish(
  s: WorkoutSession,
  complete: boolean,
  now: number,
): WorkoutSession {
  if (s.status !== "active") return s;
  return {
    ...s,
    status: complete ? "complete" : "incomplete",
    finishedAt: now,
    activeMs: activeDuration(s, now),
    activeSince: null,
    timer: pause(s.timer, now),
  };
}
export function estimateMinutes(t: WorkoutTemplate) {
  return Math.max(
    1,
    Math.round(
      compilePhases(t).reduce(
        (sum, p) => sum + (p.manual ? 45 : p.duration),
        0,
      ) / 60,
    ),
  );
}
