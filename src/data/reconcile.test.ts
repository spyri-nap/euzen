import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { emptyState } from "../domain/empty";
import { mergeGuest, acceptServer } from "./reconcile";
import {
  saveAccount,
  stageAccount,
  loadAccount,
  resolveAccount,
} from "./accountStore";
const week = { id: "week", name: "Own", startDate: "2026-10-28" };
it("imports idempotently without mutating guest or overwriting collisions", () => {
  const guest = { ...emptyState(), weeklyPlans: [week] };
  const saved = structuredClone(guest);
  const first = mergeGuest(emptyState(), guest);
  expect(mergeGuest(first, guest)).toEqual(first);
  expect(guest).toEqual(saved);
  const colliding = mergeGuest(
    { ...emptyState(), weeklyPlans: [{ ...week, name: "Other" }] },
    guest,
  );
  expect(colliding.weeklyPlans.map((w) => w.name).sort()).toEqual([
    "Other",
    "Own",
  ]);
  expect(colliding.weeklyPlans[0].id).not.toBe(colliding.weeklyPlans[1].id);
});
it("resolves only the conflicting entity and keeps unrelated operations", async () => {
  const owner = "50000000-0000-4000-8000-000000000001";
  await saveAccount(owner, 1, emptyState(), []);
  const staged = await stageAccount(owner, 1, {
    ...emptyState(),
    weeklyPlans: [week],
    preferences: { ...emptyState().preferences, audio: true },
  });
  const operation = staged.outbox.find((x) => x.kind === "week")!;
  const conflict = {
    operation,
    server: { ...week, name: "Remote" },
    revision: 2,
  };
  const result = await resolveAccount(conflict, "server");
  expect(result.state.weeklyPlans[0].name).toBe("Remote");
  expect(result.state.preferences.audio).toBe(true);
  expect(result.outbox).toHaveLength(1);
  expect(result.outbox[0].kind).toBe("settings");
  await expect(resolveAccount(conflict, "local")).rejects.toThrow(
    "Conflict no longer current",
  );
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe("Remote");
});
it("keeps latest local follow-up edits and rebases to the selected server revision", async () => {
  const owner = "50000000-0000-4000-8000-000000000002";
  await saveAccount(owner, 1, emptyState(), []);
  const first = await stageAccount(owner, 1, {
    ...emptyState(),
    weeklyPlans: [week],
  });
  await stageAccount(owner, 1, {
    ...emptyState(),
    weeklyPlans: [{ ...week, name: "Latest" }],
  });
  const result = await resolveAccount(
    {
      operation: first.outbox[0],
      server: { ...week, name: "Remote" },
      revision: 3,
    },
    "local",
  );
  expect(result.outbox).toHaveLength(1);
  expect(result.outbox[0].expectedRevision).toBe(3);
  expect(result.outbox[0].payload?.name).toBe("Latest");
});
it("applies a server deletion to the selected independent entity", () => {
  const state = { ...emptyState(), weeklyPlans: [week] };
  expect(
    acceptServer(state, {
      operation: {
        id: crypto.randomUUID(),
        owner: crypto.randomUUID(),
        generation: 1,
        kind: "week",
        entityId: "week",
        expectedRevision: 0,
        payload: week,
        remove: false,
      },
      server: null,
      revision: 1,
    }).weeklyPlans,
  ).toEqual([]);
});

it("remaps complete guest references and preserves historical snapshots after removing the live library", async () => {
  const { initialState } = await import("../domain/seed");
  const { newSession, finish } = await import("../domain/timer");
  const { validateState } = await import("../domain/model");
  const guest = initialState();
  const history = finish(
    newSession(guest.templates[0], guest.exercises, null),
    false,
    Date.now() + 1000,
  );
  guest.sessions = [history];
  const imported = mergeGuest(emptyState(), guest);
  expect(imported.templates[0].id).not.toBe(guest.templates[0].id);
  expect(imported.sessions[0].snapshot.id).toBe(imported.templates[0].id);
  expect(
    validateState({ ...imported, exercises: [], templates: [], scheduled: [] })
      .sessions[0].exercises,
  ).toEqual(imported.sessions[0].exercises);
  expect(guest.sessions[0].snapshot.id).toBe(history.snapshot.id);
});
it("rejects incompatible same-day check-ins and two active sessions without mutating the source", async () => {
  const guest = {
    ...emptyState(),
    checkins: [{ date: "2026-10-28", energy: 3, recovery: 3 }],
  };
  const target = {
    ...emptyState(),
    checkins: [{ date: "2026-10-28", energy: 5, recovery: 5 }],
  };
  const original = structuredClone(guest);
  expect(() => mergeGuest(target, guest)).toThrow("Check-in date conflict");
  expect(guest).toEqual(original);
  const { initialState } = await import("../domain/seed");
  const { newSession } = await import("../domain/timer");
  const state = initialState();
  const active = {
    ...state,
    sessions: [newSession(state.templates[0], state.exercises, null)],
  };
  expect(() => mergeGuest(active, active)).toThrow("Mehrere aktive Sessions");
});

it("archives both conflict versions atomically before a destructive selection", async () => {
  const owner = "85000000-0000-4000-8000-000000000001";
  await saveAccount(owner, 1, emptyState(), []);
  const first = await stageAccount(owner, 1, {
    ...emptyState(),
    weeklyPlans: [week],
  });
  await resolveAccount(
    {
      operation: first.outbox[0],
      server: { ...week, name: "Server archive" },
      revision: 2,
    },
    "server",
  );
  const archived = await (await import("./accountStore")).latestRecovery(owner);
  expect(archived?.weeklyPlans[0].name).toBe("Own");
  expect(
    (archived?.recoveryConflict as { server: { name: string } }).server.name,
  ).toBe("Server archive");
});
