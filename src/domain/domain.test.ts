import { describe, expect, it } from "vitest";
import {
  addDays,
  block,
  localDate,
  monday,
  prescription,
  validateState,
  type SetResult,
  type WorkoutTemplate,
} from "./model";
import { initialState } from "./seed";
import {
  activeDuration,
  compilePhases,
  elapsed,
  extend,
  finish,
  freshTimer,
  newSession,
  pause,
  settle,
  start,
} from "./timer";
import {
  coachContext,
  previousResult,
  resultVolume,
  summary,
} from "./analytics";
import { parseBackup } from "../data/storage";

function template(
  mode: WorkoutTemplate["blocks"][number]["mode"] = "sets",
): WorkoutTemplate {
  return {
    id: "test",
    name: "Test",
    description: "",
    dimension: "Kraft",
    sample: false,
    updatedAt: 1,
    blocks: [
      {
        ...block("goblet"),
        id: "test-block",
        mode,
        rounds: 2,
        work: 10,
        rest: 5,
        transition: 2,
      },
    ],
  };
}
function result(
  session = newSession(template(), initialState().exercises, null),
): SetResult {
  const p = session.phases[0];
  return {
    id: "r1",
    stepId: p.id,
    blockId: p.blockId,
    prescriptionId: p.prescriptionId,
    exerciseId: p.exerciseId,
    round: 1,
    reps: 8,
    load: 16,
    implements: 2,
    seconds: 30,
    rpe: 6,
    rir: 3,
    notes: "",
    skipped: false,
    recordedAt: Date.now(),
    distance: null,
    roundsCompleted: 1,
  };
}
describe("timestamp timer", () => {
  it("does not double-start and excludes paused time, including after JSON round-trip", () => {
    let timer = start(freshTimer(), 1000);
    expect(start(timer, 2000)).toEqual(timer);
    expect(elapsed(timer, 6000)).toBe(5000);
    timer = pause(timer, 6000);
    expect(elapsed(timer, 60000)).toBe(5000);
    timer = start(JSON.parse(JSON.stringify(timer)), 90000);
    expect(elapsed(timer, 93000)).toBe(8000);
  });
  it("expires once at a bounded duration when the browser returns much later", () => {
    const timer = settle(start(freshTimer(), 1000), 10, false, 1000000);
    expect(timer.status).toBe("expired");
    expect(elapsed(timer, 2000000)).toBe(10000);
    expect(settle(timer, 10, false, 2000000)).toBe(timer);
  });
  it("manual counters never auto-expire", () => {
    expect(settle(start(freshTimer(), 0), 10, true, 999999).status).toBe(
      "running",
    );
  });
  it("adds a full 30 seconds without losing elapsed training time", () => {
    let timer = extend(start(freshTimer(), 1000), 30, 2000);
    expect(timer.elapsedMs).toBe(1000);
    expect(timer.extensionMs).toBe(30000);
    timer = start(timer, 3000);
    expect(settle(timer, 10, false, 40000).status).toBe("running");
    expect(settle(timer, 10, false, 42000).status).toBe("expired");
  });
  it("can extend an expired phase and resume", () => {
    let timer = settle(start(freshTimer(), 0), 10, false, 10000);
    timer = start(extend(timer, 30, 20000), 20000);
    expect(elapsed(timer, 30000)).toBe(20000);
    expect(settle(timer, 10, false, 30000).status).toBe("running");
  });
});
describe("workout compilation and snapshots", () => {
  it("completes traditional sets exercise by exercise", () => {
    const t = template("sets");
    t.blocks[0].exercises.push(prescription("row"));
    expect(
      compilePhases(t)
        .filter((p) => p.kind === "work")
        .map((p) => p.exerciseId),
    ).toEqual(["goblet", "goblet", "row", "row"]);
  });
  it("preserves already compiled session order when templates change", () => {
    const t = template("rounds");
    t.blocks[0].exercises.push(prescription("row"));
    const s = newSession(t, initialState().exercises, null);
    t.blocks[0].mode = "sets";
    expect(
      s.phases.filter((p) => p.kind === "work").map((p) => p.exerciseId),
    ).toEqual(["goblet", "row", "goblet", "row"]);
  });
  it("generates deterministic unique work and rest steps for a circuit", () => {
    const t = template("rounds");
    t.blocks[0].exercises.push(prescription("row"));
    const phases = compilePhases(t);
    expect(phases.map((p) => p.kind)).toEqual([
      "work",
      "transition",
      "work",
      "rest",
      "work",
      "transition",
      "work",
    ]);
    expect(new Set(phases.map((p) => p.id)).size).toBe(phases.length);
    expect(phases.filter((p) => p.kind === "work").every((p) => p.manual)).toBe(
      true,
    );
  });
  it("EMOM schedules a timed slot per exercise per round without extra rest", () => {
    const t = template("emom");
    t.blocks[0].exercises.push(prescription("row"));
    const phases = compilePhases(t);
    expect(phases).toHaveLength(4);
    expect(
      phases.every((p) => p.kind === "work" && !p.manual && p.duration === 10),
    ).toBe(true);
  });
  it("AMRAP has one time window, not rounds multiplied by duration", () => {
    expect(compilePhases(template("amrap"))).toHaveLength(1);
  });
  it("later edits never rewrite session templates or exercise metadata", () => {
    const t = template();
    const exercises = initialState().exercises;
    const s = newSession(t, exercises, null);
    t.name = "Changed";
    t.blocks[0].exercises[0].reps = 50;
    exercises[0].name = "Changed";
    expect(s.snapshot.name).toBe("Test");
    expect(s.snapshot.blocks[0].exercises[0].reps).toBe(8);
    expect(s.exercises[0].name).toBe("Goblet Squat");
  });
  it("finishes idempotently and excludes idle time", () => {
    let s = newSession(template(), initialState().exercises, null);
    s = { ...s, activeSince: 1000, startedAt: 1000 };
    expect(activeDuration(s, 5000)).toBe(4000);
    const ended = finish(s, false, 5000);
    expect(ended.activeMs).toBe(4000);
    expect(finish(ended, true, 9000)).toBe(ended);
  });
});
describe("calendar dates", () => {
  it("crosses year and week boundaries without treating dates as UTC instants", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(monday("2027-01-03")).toBe("2026-12-28");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(localDate(new Date(2026, 9, 22, 0, 1))).toBe("2026-10-22");
  });
});
describe("honest metrics and comparison", () => {
  it("includes number of implements and does not invent bodyweight tonnage", () => {
    const s = newSession(template(), initialState().exercises, null);
    const r = result(s);
    expect(resultVolume(r, s)).toBe(256);
    expect(resultVolume({ ...r, load: 0 }, s)).toBeNull();
    expect(resultVolume({ ...r, skipped: true }, s)).toBeNull();
    expect(resultVolume({ ...r, exerciseId: "walk" }, s)).toBeNull();
  });
  it("counts incomplete workouts without marking them complete and ignores active sessions", () => {
    const s = newSession(template(), initialState().exercises, null);
    s.results = [result(s)];
    expect(summary([s]).volume).toBeNull();
    const ended = finish(s, false, Date.now());
    expect(summary([ended])).toMatchObject({
      complete: 0,
      incomplete: 1,
      volume: 256,
      results: 1,
      days: 1,
    });
    expect(summary([]).volume).toBeNull();
  });
  it("compares compatible protocols and rejects changes to tempo or circuit order", () => {
    const state = initialState();
    const t = template();
    const old = newSession(t, state.exercises, null);
    old.startedAt = 1000;
    old.results = [result(old)];
    state.sessions = [finish(old, false, 5000)];
    const s = newSession(t, state.exercises, null);
    const p = s.phases[0];
    expect(
      previousResult(state, s, p.exerciseId, p.prescriptionId, p.blockId, 1),
    ).not.toBeNull();
    s.snapshot.blocks[0].exercises[0].tempo = "3-1-1";
    expect(
      previousResult(state, s, p.exerciseId, p.prescriptionId, p.blockId, 1),
    ).toBeNull();
  });
  it("coach context never contains free-text notes or identifiers", () => {
    const state = initialState();
    const s = newSession(template(), state.exercises, null);
    s.results = [{ ...result(s), notes: "PRIVATE NOTE" }];
    s.notes = "PRIVATE SESSION";
    state.sessions = [finish(s, false, Date.now())];
    const ctx = JSON.stringify(coachContext(state));
    expect(ctx).not.toContain("PRIVATE");
    expect(ctx).not.toContain(s.id);
  });
});
describe("backup validation", () => {
  it("rejects workloads that would compile to an excessive number of steps", () => {
    const state = initialState();
    state.templates[0].blocks[1].rounds = 1000;
    state.templates[0].blocks[1].exercises = Array.from({ length: 20 }, () =>
      prescription("goblet"),
    );
    expect(() => validateState(state)).toThrow();
  });
  it("rejects a complete session without all results and inconsistent timer anchors", () => {
    const state = initialState();
    const s = newSession(state.templates[0], state.exercises, null);
    state.sessions = [
      { ...s, status: "complete", finishedAt: s.startedAt + 100 },
    ];
    expect(() => validateState(state)).toThrow();
    state.sessions = [
      { ...s, timer: { ...s.timer, status: "running", startedAt: null } },
    ];
    expect(() => validateState(state)).toThrow();
  });
  it("rejects an empty exercise library that cannot support the builder", () => {
    const state = initialState();
    state.exercises = [];
    expect(() => validateState(state)).toThrow();
  });
  it("round-trips a valid state and rejects unsupported versions", () => {
    const state = initialState();
    expect(parseBackup(JSON.stringify(state))).toEqual(state);
    expect(() =>
      parseBackup(JSON.stringify({ ...state, schemaVersion: 2 })),
    ).toThrow();
  });
  it("rejects broken references, invalid dates and multiple active sessions", () => {
    const state = initialState();
    state.scheduled[0].date = "2026-02-30";
    expect(() => validateState(state)).toThrow();
    state.scheduled[0].date = "2026-10-22";
    state.templates[0].blocks[0].exercises[0].exerciseId = "missing";
    expect(() => validateState(state)).toThrow();
    const valid = initialState();
    valid.sessions = [
      newSession(valid.templates[0], valid.exercises, null),
      newSession(valid.templates[1], valid.exercises, null),
    ];
    expect(() => validateState(valid)).toThrow();
  });
  it("rejects AMRAP circuits with ambiguous round semantics", () => {
    const state = initialState();
    state.templates[0].blocks[1].mode = "amrap";
    expect(() => validateState(state)).toThrow();
  });
  it("rejects malformed JSON without changing the original state", () => {
    const state = initialState();
    const original = JSON.stringify(state);
    expect(() => parseBackup("{broken")).toThrow();
    expect(JSON.stringify(state)).toBe(original);
  });
});
