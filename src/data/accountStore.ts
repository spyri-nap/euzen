import { openDB } from "idb";
import { changes, entityKey } from "./sync";
import { z } from "zod";
import { stateSchema, validateState, type AppState } from "../domain/model";
const account = z.uuid();
export const operationSchema = z.object({
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
export type PendingOperation = z.infer<typeof operationSchema>;
const partition = z.object({
  owner: z.uuid(),
  generation: z.number().int().positive(),
  state: stateSchema,
  outbox: z.array(operationSchema),
  revisions: z.record(z.string(), z.number().int().nonnegative()).default({}),
});
const connection = () =>
  openDB("euzen-accounts", 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("partitions"))
        db.createObjectStore("partitions");
      if (!db.objectStoreNames.contains("recovery"))
        db.createObjectStore("recovery");
    },
  });
/** Separate API, not yet wired into auth/UI. State and outbox commit atomically. */
export async function saveAccount(
  owner: string,
  generation: number,
  state: AppState,
  outbox: PendingOperation[],
  revisions: Record<string, number> = {},
) {
  account.parse(owner);
  validateState(state);
  const checked = partition.parse({
    owner,
    generation,
    state,
    outbox,
    revisions,
  });
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

/** Read/modify/write in ONE transaction: uploads cannot erase concurrent local edits. */
export async function stageAccount(
  owner: string,
  generation: number,
  next: AppState,
  expected: Record<string, number> = {},
) {
  account.parse(owner);
  const checked = validateState(next);
  const db = await connection();
  try {
    const tx = db.transaction("partitions", "readwrite");
    try {
      const raw = await tx.store.get(owner);
      if (!raw) throw Error("Account not initialized");
      const previous = partition.parse(raw);
      if (previous.owner !== owner || previous.generation !== generation)
        throw Error("Stale generation");
      const added = changes(
        owner,
        generation,
        previous.state,
        checked,
        previous.revisions,
        previous.outbox,
      );
      for (const op of added) {
        const key = entityKey(op.kind, op.entityId);
        if (expected[key] !== undefined) op.expectedRevision = expected[key];
      }
      const result = partition.parse({
        ...previous,
        state: checked,
        outbox: [...previous.outbox, ...added],
      });
      await tx.store.put(result, owner);
      await tx.done;
      return result;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* transaction already completed */
      }
      await tx.done.catch(() => {});
      throw error;
    }
  } finally {
    db.close();
  }
}
export async function acknowledgeAccount(
  operation: PendingOperation,
  revision: number,
) {
  operationSchema.parse(operation);
  if (
    !Number.isSafeInteger(revision) ||
    revision !== operation.expectedRevision + 1
  )
    throw Error("Invalid acknowledgement");
  const db = await connection();
  try {
    const tx = db.transaction("partitions", "readwrite");
    try {
      const current = partition.parse(await tx.store.get(operation.owner));
      if (
        current.owner !== operation.owner ||
        current.generation !== operation.generation
      )
        throw Error("Stale generation");
      const queued = current.outbox.find((op) => op.id === operation.id);
      if (!queued) {
        await tx.done;
        return;
      }
      if (JSON.stringify(queued) !== JSON.stringify(operation))
        throw Error("Operation mismatch");
      const key = entityKey(operation.kind, operation.entityId);
      if (
        current.outbox.some(
          (op) =>
            op.id !== operation.id &&
            entityKey(op.kind, op.entityId) === key &&
            op.expectedRevision < operation.expectedRevision,
        )
      )
        throw Error("Out of order acknowledgement");
      await tx.store.put(
        {
          ...current,
          revisions: { ...current.revisions, [key]: revision },
          outbox: current.outbox.filter((op) => op.id !== operation.id),
        },
        operation.owner,
      );
      await tx.done;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* transaction already completed */
      }
      await tx.done.catch(() => {});
      throw error;
    }
  } finally {
    db.close();
  }
}

/** Resolve only the conflicted entity; retain every unrelated local operation. */
export async function resolveAccount(
  conflict: import("./sync").SyncConflict,
  choice: "local" | "server",
) {
  const { acceptServer } = await import("./reconcile");
  const { operation } = conflict;
  const db = await connection();
  try {
    const tx = db.transaction(["partitions", "recovery"], "readwrite");
    try {
      const current = partition.parse(
        await tx.objectStore("partitions").get(operation.owner),
      );
      if (
        current.owner !== operation.owner ||
        current.generation !== operation.generation
      )
        throw Error("Stale generation");
      const first = current.outbox.find(
        (op) =>
          op.kind === operation.kind && op.entityId === operation.entityId,
      );
      if (first?.id !== operation.id) throw Error("Conflict no longer current");
      const key = entityKey(operation.kind, operation.entityId);
      const matching = current.outbox.filter(
        (op) => entityKey(op.kind, op.entityId) === key,
      );
      const remaining = current.outbox.filter(
        (op) => entityKey(op.kind, op.entityId) !== key,
      );
      const latest = matching.at(-1)!;
      const state =
        choice === "server"
          ? acceptServer(current.state, conflict)
          : current.state;
      if (choice === "local")
        remaining.push({
          ...latest,
          id: crypto.randomUUID(),
          expectedRevision: conflict.revision,
        });
      const result = partition.parse({
        ...current,
        state,
        outbox: remaining,
        revisions: { ...current.revisions, [key]: conflict.revision },
      });
      await tx.objectStore("recovery").put(
        {
          ...current,
          archivedAt: Date.now(),
          conflict: {
            kind: operation.kind,
            entityId: operation.entityId,
            serverRevision: conflict.revision,
            server: conflict.server,
            local: latest.payload,
          },
        },
        `${current.owner}:conflict:${crypto.randomUUID()}`,
      );
      await tx.objectStore("partitions").put(result, operation.owner);
      await tx.done;
      return result;
    } catch (e) {
      try {
        tx.abort();
      } catch {}
      await tx.done.catch(() => {});
      throw e;
    }
  } finally {
    db.close();
  }
}

/** Explicit recovery: archive the entire old generation and its outbox atomically. */
export async function acceptGeneration(fresh: {
  owner: string;
  generation: number;
  state: AppState;
  revisions: Record<string, number>;
}) {
  const checked = partition.parse({ ...fresh, outbox: [] });
  validateState(checked.state);
  const db = await connection();
  try {
    const tx = db.transaction(["partitions", "recovery"], "readwrite");
    try {
      const old = partition.parse(
        await tx.objectStore("partitions").get(fresh.owner),
      );
      if (old.owner !== fresh.owner || old.generation >= fresh.generation)
        throw Error("Generation has not advanced");
      await tx
        .objectStore("recovery")
        .put(
          { ...old, archivedAt: Date.now() },
          `${old.owner}:${old.generation}:${crypto.randomUUID()}`,
        );
      await tx.objectStore("partitions").put(checked, fresh.owner);
      await tx.done;
      return checked;
    } catch (e) {
      try {
        tx.abort();
      } catch {}
      await tx.done.catch(() => {});
      throw e;
    }
  } finally {
    db.close();
  }
}
export async function latestRecovery(owner: string) {
  account.parse(owner);
  const db = await connection();
  try {
    const entries = await db.getAll("recovery");
    const own = entries
      .filter((e) => e.owner === owner)
      .sort(
        (a, b) => b.generation - a.generation || b.archivedAt - a.archivedAt,
      );
    return own[0]
      ? {
          ...partition.parse(own[0]).state,
          ...(own[0].conflict ? { recoveryConflict: own[0].conflict } : {}),
        }
      : null;
  } finally {
    db.close();
  }
}
