import {
  uid,
  type WorkoutSession,
  type WorkoutBlock,
  type Prescription,
} from "./model";
import {
  elapsed,
  activeDuration,
  freshTimer,
  start,
  settle,
  finish,
} from "./timer";

export function targetFor(
  b: WorkoutBlock,
  p: Prescription,
  round: number,
): Prescription {
  const target = b.setTargets.find(
    (t) => t.prescriptionId === p.id && t.round === round,
  );
  return target ? { ...p, reps: target.reps, load: target.load } : p;
}

/** Reconcile against deadlines, not callback frequency. No assumed completed reps. */
export function advanceGuided(s: WorkoutSession, now: number): WorkoutSession {
  let current = s;
  for (let guard = 0; guard < s.phases.length; guard++) {
    const phase = current.phases[current.phaseIndex];
    const b = current.snapshot.blocks.find((b) => b.id === phase.blockId)!;
    if (
      current.status !== "active" ||
      current.timer.status !== "running" ||
      phase.manual
    )
      break;
    const automaticWork =
      b.guided && ["emom", "interval", "countdown"].includes(b.mode);
    if (phase.kind === "work" && !automaticWork) break;
    const duration = phase.duration * 1000 + current.timer.extensionMs;
    if (elapsed(current.timer, now) < duration) break;
    const deadline =
      current.timer.startedAt! +
      Math.max(0, duration - current.timer.elapsedMs);
    let results = current.results;
    if (phase.kind === "work" && !results.some((r) => r.stepId === phase.id)) {
      const p = b.exercises.find((p) => p.id === phase.prescriptionId)!;
      results = [
        ...results,
        {
          id: uid(),
          stepId: phase.id,
          blockId: b.id,
          prescriptionId: p.id,
          exerciseId: p.exerciseId,
          round: phase.round,
          reps: current.draft?.reps ?? 0,
          load: current.draft?.load ?? 0,
          implements: p.implements,
          seconds: Math.min(86400, duration / 1000),
          distance: current.draft?.distance ?? null,
          rpe: current.draft?.rpe ?? null,
          rir: current.draft?.rir ?? null,
          notes: `Zeitfenster abgelaufen. Tatsächliche Ausführung noch bestätigen. ${current.draft?.notes ?? ""}`,
          roundsCompleted: 0,
          skipped: true,
          pendingConfirmation: true,
          recordedAt: deadline,
        },
      ];
    }
    current = {
      ...current,
      results,
      draft: null,
      activeMs: activeDuration(current, deadline),
      activeSince: null,
      timer: settle(current.timer, phase.duration, false, deadline),
    };
    if (current.phaseIndex === current.phases.length - 1)
      return finish(
        current,
        results.length > 0 && !results.some((r) => r.skipped),
        deadline,
      );
    const following = current.phases[current.phaseIndex + 1];
    const followingBlock = current.snapshot.blocks.find(
      (b) => b.id === following.blockId,
    )!;
    const autoStart =
      following.blockId === b.id ||
      followingBlock.guided ||
      following.kind === "prepare";
    current = {
      ...current,
      phaseIndex: current.phaseIndex + 1,
      timer: autoStart ? start(freshTimer(), deadline) : freshTimer(),
      activeSince: autoStart ? deadline : null,
    };
  }
  return current;
}
