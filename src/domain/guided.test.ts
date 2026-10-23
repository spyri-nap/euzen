import { describe, it, expect } from "vitest";
import { initialState } from "./seed";
import { block, type WorkoutTemplate, validateState } from "./model";
import { newSession, start, freshTimer, pause } from "./timer";
import { advanceGuided, targetFor } from "./guided";
import { summary } from "./analytics";

function fixture() {
  const state = initialState();
  const t: WorkoutTemplate = {
    ...state.templates[0],
    blocks: [
      {
        ...block("goblet"),
        guided: true,
        mode: "emom",
        rounds: 3,
        work: 10,
        prepare: 5,
      },
    ],
  };
  const s = newSession(t, state.exercises, null);
  s.startedAt = 1000;
  s.timer = start(freshTimer(), 1000);
  s.activeSince = 1000;
  return { s, state };
}
describe("guided timeline", () => {
  it("preserves explicit drafts without treating them as confirmed performance", () => {
    const { s } = fixture();
    const n = advanceGuided(s, 6000);
    n.draft = {
      reps: 7,
      load: 16,
      distance: null,
      rpe: 6,
      rir: null,
      notes: "Meine Notiz",
      rounds: 0,
      partial: 0,
    };
    const ended = advanceGuided(n, 17000);
    expect(ended.results[0]).toMatchObject({
      reps: 7,
      load: 16,
      pendingConfirmation: true,
      skipped: true,
    });
    expect(ended.results[0].notes).toContain("Meine Notiz");
  });
  it("prepares without fabricating an exercise result", () => {
    const { s } = fixture();
    const n = advanceGuided(s, 6000);
    expect(n.phaseIndex).toBe(1);
    expect(n.results).toHaveLength(0);
    expect(n.timer.startedAt).toBe(6000);
  });
  it("catches up multiple elapsed intervals from exact deadlines", () => {
    const { s } = fixture();
    const n = advanceGuided(s, 27000);
    expect(n.phaseIndex).toBe(3);
    expect(n.results).toHaveLength(2);
    expect(n.timer.startedAt).toBe(26000);
    expect(
      n.results.every(
        (r) => r.pendingConfirmation && r.skipped && r.reps === 0,
      ),
    ).toBe(true);
  });
  it("finishes with unconfirmed results excluded from performance totals", () => {
    const { s, state } = fixture();
    const n = advanceGuided(s, 99000);
    expect(n.status).toBe("incomplete");
    expect(n.finishedAt).toBe(36000);
    expect(n.activeMs).toBe(35000);
    expect(summary([n]).volume).toBeNull();
    expect(summary([n]).results).toBe(0);
    expect(advanceGuided(n, 120000)).toBe(n);
    state.sessions = [n];
    expect(() => validateState(state)).not.toThrow();
  });
  it("does not advance a paused or manually controlled work phase", () => {
    const { s } = fixture();
    const paused = { ...s, timer: pause(s.timer, 2000), activeSince: null };
    expect(advanceGuided(paused, 100000)).toBe(paused);
    const n = advanceGuided(s, 6000);
    n.snapshot.blocks[0].guided = false;
    expect(advanceGuided(n, 100000)).toBe(n);
  });
  it("does not duplicate results after a reload", () => {
    const { s } = fixture();
    const n = advanceGuided(s, 17000);
    const reloaded = JSON.parse(JSON.stringify(n));
    const next = advanceGuided(reloaded, 18000);
    expect(next.results).toHaveLength(1);
  });
  it("resolves per-set overrides without changing the base prescription", () => {
    const { s } = fixture();
    const b = s.snapshot.blocks[0],
      p = b.exercises[0];
    b.setTargets = [{ prescriptionId: p.id, round: 2, reps: 6, load: 20 }];
    expect(targetFor(b, p, 2)).toMatchObject({ reps: 6, load: 20 });
    expect(targetFor(b, p, 1)).toBe(p);
    expect(p.load).toBe(0);
  });
});
