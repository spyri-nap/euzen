import { openDB } from "idb";
import { z } from "zod";
import { stateSchema, validateState, type AppState } from "../domain/model";
const account = z.uuid();
const operation = z.object({
  id: z.uuid(),
  owner: z.uuid(),
  generation: z.number().int().positive(),
  kind: z.enum([
    "exercise",
    "workout",
    "week",
    "scheduled",
    "session",
    "checkin",
    "settings",
  ]),
  entityId: z.string().min(1).max(100),
  expectedRevision: z.number().int().nonnegative(),
  payload: z.record(z.string(), z.unknown()).nullable(),
  remove: z.boolean(),
});
export type PendingOperation = z.infer<typeof operation>;
const partition = z.object({
  owner: z.uuid(),
  generation: z.number().int().positive(),
  state: stateSchema,
  outbox: z.array(operation),
});
const connection = () =>
  openDB("euzen-accounts", 1, {
    upgrade(db) {
      db.createObjectStore("partitions");
    },
  });
/** Separate API, not yet wired into auth/UI. State and outbox commit atomically. */
export async function saveAccount(
  owner: string,
  generation: number,
  state: AppState,
  outbox: PendingOperation[],
) {
  account.parse(owner);
  validateState(state);
  const checked = partition.parse({ owner, generation, state, outbox });
  if (
    checked.outbox.some(
      (op) => op.owner !== owner || op.generation !== generation,
    )
  )
    throw Error("Partition mismatch");
  const db = await connection();
  try {
    const tx = db.transaction("partitions", "readwrite");
    const previous = await tx.store.get(owner);
    if (
      previous !== undefined &&
      partition.parse(previous).generation > generation
    ) {
      tx.abort();
      await tx.done.catch(() => {});
      throw Error("Stale generation");
    }
    await tx.store.put(checked, owner);
    await tx.done;
  } finally {
    db.close();
  }
}
export async function loadAccount(owner: string) {
  account.parse(owner);
  const db = await connection();
  try {
    const raw = await db.get("partitions", owner);
    if (raw === undefined) return null;
    const checked = partition.parse(raw);
    validateState(checked.state);
    if (
      checked.owner !== owner ||
      checked.outbox.some(
        (op) => op.owner !== owner || op.generation !== checked.generation,
      )
    )
      throw Error("Partition mismatch");
    return checked;
  } finally {
    db.close();
  }
}
