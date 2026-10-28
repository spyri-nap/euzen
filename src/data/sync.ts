import { validateState, type AppState } from "../domain/model";
import type { PendingOperation } from "./accountStore";

export type Entity = {
  kind: PendingOperation["kind"];
  id: string;
  payload: Record<string, unknown>;
};
export type RevisionMap = Record<string, number>;
export const entityKey = (kind: string, id: string) =>
  JSON.stringify([kind, id]);
export function entities(state: AppState): Entity[] {
  const s = validateState(state);
  return [
    ...s.exercises.map((payload) => ({
      kind: "exercise" as const,
      id: payload.id,
      payload,
    })),
    ...s.templates.map((payload) => ({
      kind: "workout" as const,
      id: payload.id,
      payload,
    })),
    ...s.weeklyPlans.map((payload) => ({
      kind: "week" as const,
      id: payload.id,
      payload,
    })),
    ...s.scheduled.map((payload) => ({
      kind: "scheduled" as const,
      id: payload.id,
      payload,
    })),
    ...s.sessions.map((payload) => ({
      kind: "session" as const,
      id: payload.id,
      payload,
    })),
    ...s.checkins.map((payload) => ({
      kind: "checkin" as const,
      id: payload.date,
      payload,
    })),
    { kind: "settings", id: "preferences", payload: s.preferences },
  ];
}
/** Deterministic equality ignores object key ordering, preserving array order. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function changes(
  owner: string,
  generation: number,
  before: AppState,
  after: AppState,
  revisions: RevisionMap,
  queued: PendingOperation[],
  id = () => crypto.randomUUID(),
): PendingOperation[] {
  const old = new Map(
    entities(before).map((e) => [entityKey(e.kind, e.id), e]),
  );
  const next = new Map(
    entities(after).map((e) => [entityKey(e.kind, e.id), e]),
  );
  const result: PendingOperation[] = [];
  for (const key of new Set([...old.keys(), ...next.keys()])) {
    const a = old.get(key),
      b = next.get(key);
    if (canonical(a?.payload ?? null) === canonical(b?.payload ?? null))
      continue;
    const entity = b ?? a!;
    const preceding = queued.filter(
      (op) => entityKey(op.kind, op.entityId) === key,
    ).length;
    result.push({
      id: id(),
      owner,
      generation,
      kind: entity.kind,
      entityId: entity.id,
      expectedRevision: (revisions[key] ?? 0) + preceding,
      payload: b?.payload ?? null,
      remove: !b,
    });
  }
  const rank: Record<PendingOperation["kind"], number> = {
    exercise: 0,
    workout: 1,
    week: 2,
    scheduled: 3,
    session: 4,
    checkin: 5,
    settings: 6,
  };
  // Establish new references first, release dependencies before deleting parents.
  return result.sort(
    (a, b) =>
      Number(a.remove) - Number(b.remove) ||
      (a.remove ? rank[b.kind] - rank[a.kind] : rank[a.kind] - rank[b.kind]),
  );
}
export type SyncConflict = {
  operation: PendingOperation;
  server: Record<string, unknown> | null;
  revision: number;
};
export type Ack =
  | { kind: "accepted"; revision: number }
  | {
      kind: "conflict";
      server: Record<string, unknown> | null;
      revision: number;
    };
export interface SyncTransport {
  push(operation: PendingOperation, signal: AbortSignal): Promise<Ack>;
}
/** Caller persists accepted changes before removing the durable outbox entry. */
export async function drain(
  operations: readonly PendingOperation[],
  transport: SyncTransport,
  signal: AbortSignal,
  acknowledge: (operation: PendingOperation, revision: number) => Promise<void>,
): Promise<SyncConflict | null> {
  for (const operation of operations) {
    signal.throwIfAborted();
    const result = await transport.push(structuredClone(operation), signal);
    signal.throwIfAborted();
    if (result.kind === "conflict")
      return { operation, server: result.server, revision: result.revision };
    if (
      !Number.isSafeInteger(result.revision) ||
      result.revision !== operation.expectedRevision + 1
    )
      throw Error("Invalid acknowledgement");
    await acknowledge(operation, result.revision);
  }
  return null;
}
