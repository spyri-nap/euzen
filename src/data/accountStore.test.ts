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
