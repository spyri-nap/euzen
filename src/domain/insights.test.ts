import { describe, expect, it } from "vitest";
import { initialState } from "./seed";
import { block, resultSchema, uid } from "./model";
import { newSession } from "./timer";
import {
  difference,
  exerciseTrends,
  periodComparison,
  periodSessions,
  weeklyReview,
  trendComparison,
} from "./insights";

function fixture(date = "2026-10-22") {
  const state = initialState();
  const template = {
    ...state.templates[0],
    blocks: [{ ...block("goblet"), rounds: 2 }],
  };
  const session = newSession(template, state.exercises, null);
  session.startedAt = new Date(`${date}T12:00:00`).getTime();
  session.finishedAt = session.startedAt + 600000;
  session.status = "complete";
  session.activeMs = 600000;
  session.results = session.phases
    .filter((p) => p.kind === "work")
    .map((p) =>
      resultSchema.parse({
        id: uid(),
        stepId: p.id,
        blockId: p.blockId,
        prescriptionId: p.prescriptionId,
        exerciseId: p.exerciseId,
        round: p.round,
        reps: 8,
        load: 16,
        implements: 1,
        seconds: 30,
        distance: null,
        rpe: 6,
        rir: null,
        notes: "",
        skipped: false,
        recordedAt: session.startedAt,
      }),
    );
  state.sessions = [session];
  return { state, session };
}

describe("calendar comparisons", () => {
  it("uses non-overlapping inclusive windows and excludes future and active sessions", () => {
    const sessions = [
      "2026-10-08",
      "2026-10-09",
      "2026-10-15",
      "2026-10-16",
      "2026-10-22",
      "2026-10-23",
    ].map((d) => fixture(d).session);
    sessions.push({ ...fixture().session, status: "active" });
    const comparison = periodComparison(sessions, 7, "2026-10-22");
    expect(comparison.currentCount).toBe(2);
    expect(comparison.previousCount).toBe(2);
    expect(comparison.start).toBe("2026-10-16");
    expect(comparison.previousStart).toBe("2026-10-09");
  });
  it("handles month/year boundaries and daylight-saving calendar days", () => {
    expect(periodComparison([], 7, "2027-01-02").start).toBe("2026-12-27");
    const dates = ["2026-10-24", "2026-10-25", "2026-10-26"].map(
      (d) => fixture(d).session,
    );
    expect(periodSessions(dates, 2, "2026-10-26")).toHaveLength(2);
  });
  it("does not invent volume or infinite percentages", () => {
    expect(difference(null, 0)).toBeNull();
    expect(difference(5, 0)).toEqual({ absolute: 5, percent: null });
    expect(difference(5, 10)).toEqual({ absolute: -5, percent: -50 });
    expect(periodComparison([], 7).current.volume).toBeNull();
  });
});

describe("snapshot exercise trends", () => {
  it("compares only complete logs with every requested metric present", () => {
    const { session } = fixture();
    const older = structuredClone(session);
    older.id = uid();
    older.startedAt -= 86400000;
    const points = exerciseTrends([session, older])[0].points;
    expect(trendComparison(points, "volume")?.last.sessionId).toBe(session.id);
    points[1].counts.volume = 1;
    expect(trendComparison(points, "volume")).toBeNull();
    expect(trendComparison(points, "reps")).not.toBeNull();
    points[1].confirmed = 1;
    expect(trendComparison(points, "reps")).toBeNull();
  });
  it("aggregates confirmed sets and follows chronology without mutating input", () => {
    const { session } = fixture();
    const older = structuredClone(session);
    older.id = uid();
    older.startedAt -= 86400000;
    older.results.forEach((r) => (r.load = 12));
    const input = [session, older];
    const series = exerciseTrends(input);
    expect(series).toHaveLength(1);
    expect(series[0].points.map((p) => p.volume)).toEqual([192, 256]);
    expect(series[0].points[1]).toMatchObject({
      confirmed: 2,
      expected: 2,
      reps: 16,
      rpe: 6,
      rpeCount: 2,
      seconds: null,
      distance: null,
    });
    expect(input[0]).toBe(session);
  });
  it("keeps partial logs visible, and pending, skipped and active results out", () => {
    const { session } = fixture();
    session.results[1].skipped = true;
    session.results[1].pendingConfirmation = true;
    const points = exerciseTrends([session])[0].points;
    expect(points[0]).toMatchObject({ volume: 128, confirmed: 1, expected: 2 });
    expect(exerciseTrends([{ ...session, status: "active" }])).toEqual([]);
    session.results[0].skipped = true;
    expect(exerciseTrends([session])).toEqual([]);
  });
  it.each(["equipment", "side", "tempo", "rounds", "mode", "implements"])(
    "separates changed %s",
    (field) => {
      const { session } = fixture();
      const changed = structuredClone(session);
      changed.id = uid();
      const b = changed.snapshot.blocks[0],
        p = b.exercises[0];
      if (field === "equipment")
        changed.exercises.find((e) => e.id === "goblet")!.equipment =
          "Kurzhantel";
      if (field === "side") p.side = "Links";
      if (field === "tempo") p.tempo = "3-1-1";
      if (field === "rounds") b.rounds = 3;
      if (field === "mode") b.mode = "emom";
      if (field === "implements") {
        p.implements = 2;
        changed.results.forEach((r) => (r.implements = 2));
      }
      expect(exerciseTrends([session, changed])).toHaveLength(2);
    },
  );
  it("counts available RPE values without filling missing data with zero", () => {
    const { session } = fixture();
    session.results[1].rpe = null;
    expect(exerciseTrends([session])[0].points[0]).toMatchObject({
      rpe: 6,
      rpeCount: 1,
    });
    session.results.forEach((r) => {
      r.load = 0;
      r.rpe = null;
    });
    expect(exerciseTrends([session])[0].points[0]).toMatchObject({
      volume: null,
      rpe: null,
      rpeCount: 0,
    });
  });
  it("uses historical snapshots after current exercise deletion", () => {
    const { state, session } = fixture();
    state.exercises = [];
    state.templates = [];
    expect(exerciseTrends(state.sessions)[0].name).toBe(
      session.exercises.find((e) => e.id === "goblet")!.name,
    );
  });
});

describe("weekly reflection", () => {
  it("limits check-ins and pending confirmations to the same seven-day window", () => {
    const { state, session } = fixture();
    session.status = "incomplete";
    session.results[0].skipped = true;
    session.results[0].pendingConfirmation = true;
    state.checkins = [
      { date: "2026-10-15", energy: 1, recovery: 1 },
      { date: "2026-10-16", energy: 4, recovery: 2 },
      { date: "2026-10-22", energy: 2, recovery: 4 },
      { date: "2026-10-23", energy: 5, recovery: 5 },
    ];
    const review = weeklyReview(state, "2026-10-22");
    expect(review).toMatchObject({
      pending: 1,
      checkins: 2,
      energy: 3,
      recovery: 3,
      patterns: { Squat: 1 },
    });
  });
  it("has an honest empty state", () => {
    const review = weeklyReview(initialState(), "2026-10-22");
    expect(review).toMatchObject({
      currentCount: 0,
      previousCount: 0,
      energy: null,
      recovery: null,
      pending: 0,
    });
  });
});
