import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import {
  saveAccount,
  loadAccount,
  type PendingOperation,
} from "./accountStore";
import { emptyState } from "../domain/empty";
const a = "10000000-0000-4000-8000-000000000001",
  b = "10000000-0000-4000-8000-000000000002";
it("persists account data and outbox together without leaking partitions", async () => {
  const op: PendingOperation = {
    id: crypto.randomUUID(),
    owner: a,
    generation: 1,
    kind: "exercise",
    entityId: "x",
    expectedRevision: 0,
    payload: { name: "Own exercise" },
    remove: false,
  };
  await saveAccount(a, 1, emptyState(), [op]);
  expect((await loadAccount(a))?.outbox).toEqual([op]);
  expect(await loadAccount(b)).toBeNull();
  await expect(
    saveAccount(a, 1, emptyState(), [{ ...op, owner: b }]),
  ).rejects.toThrow();
  expect((await loadAccount(a))?.outbox).toEqual([op]);
});
it("blocks old generation writes after a confirmed generation transition", async () => {
  await saveAccount(a, 2, emptyState(), []);
  await expect(saveAccount(a, 1, emptyState(), [])).rejects.toThrow(
    "Stale generation",
  );
  expect((await loadAccount(a))?.generation).toBe(2);
});

it("atomically appends edits and preserves them during upload acknowledgement", async () => {
  const { stageAccount, acknowledgeAccount } = await import("./accountStore");
  const owner = "10000000-0000-4000-8000-000000000003";
  await saveAccount(owner, 1, emptyState(), []);
  const first = await stageAccount(owner, 1, {
    ...emptyState(),
    preferences: { ...emptyState().preferences, audio: true },
  });
  const operation = first.outbox[0];
  await stageAccount(owner, 1, emptyState());
  await acknowledgeAccount(operation, 1);
  const current = await loadAccount(owner);
  expect(current?.state.preferences.audio).toBe(false);
  expect(current?.outbox).toHaveLength(1);
  expect(current?.outbox[0].expectedRevision).toBe(1);
  await acknowledgeAccount(operation, 1); // idempotent local receipt
  expect((await loadAccount(owner))?.outbox).toHaveLength(1);
});
it("rejects forged acknowledgements and staging after a reset", async () => {
  const { stageAccount, acknowledgeAccount } = await import("./accountStore");
  const owner = "10000000-0000-4000-8000-000000000004";
  await saveAccount(owner, 1, emptyState(), []);
  const first = await stageAccount(owner, 1, {
    ...emptyState(),
    preferences: { ...emptyState().preferences, audio: true },
  });
  await expect(
    acknowledgeAccount({ ...first.outbox[0], entityId: "forged" }, 1),
  ).rejects.toThrow("Operation mismatch");
  expect((await loadAccount(owner))?.outbox).toHaveLength(1);
  await saveAccount(owner, 2, emptyState(), []);
  await expect(stageAccount(owner, 1, emptyState())).rejects.toThrow(
    "Stale generation",
  );
  await expect(acknowledgeAccount(first.outbox[0], 1)).rejects.toThrow(
    "Stale generation",
  );
});
