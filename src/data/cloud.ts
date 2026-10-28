import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { emptyState } from "../domain/empty";
import { validateState } from "../domain/model";
import { entityKey, type SyncTransport } from "./sync";
const row = z.object({
  kind: z.enum([
    "exercise",
    "workout",
    "week",
    "scheduled",
    "session",
    "checkin",
    "settings",
  ]),
  id: z.string().min(1).max(100),
  revision: z.number().int().positive(),
  payload: z.record(z.string(), z.unknown()).nullable(),
});
const snapshot = z.object({
  owner: z.uuid(),
  generation: z.number().int().positive(),
  entities: z.array(row).max(50000),
});
const ack = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("accepted"),
    revision: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("conflict"),
    revision: z.number().int().nonnegative(),
    server: z.record(z.string(), z.unknown()).nullable(),
  }),
]);
export function decodeSnapshot(input: unknown, owner: string) {
  const data = snapshot.parse(input);
  if (data.owner !== owner) throw Error("Owner mismatch");
  const state = emptyState();
  const revisions: Record<string, number> = {};
  const keys = new Set<string>();
  for (const e of data.entities) {
    const key = entityKey(e.kind, e.id);
    if (keys.has(key)) throw Error("Duplicate entity");
    keys.add(key);
    revisions[key] = e.revision;
    if (!e.payload) continue;
    if (
      ["exercise", "workout", "week", "scheduled", "session"].includes(
        e.kind,
      ) &&
      e.payload.id !== e.id
    )
      throw Error("ID mismatch");
    if (e.kind === "checkin" && e.payload.date !== e.id)
      throw Error("Date mismatch");
    const fields = {
      exercise: "exercises",
      workout: "templates",
      week: "weeklyPlans",
      scheduled: "scheduled",
      session: "sessions",
      checkin: "checkins",
    } as const;
    if (e.kind === "settings") {
      if (e.id !== "preferences") throw Error("Settings ID mismatch");
      Object.assign(state.preferences, e.payload);
    } else (state[fields[e.kind]] as unknown[]).push(e.payload);
  }
  return {
    owner,
    generation: data.generation,
    state: validateState(state),
    revisions,
  };
}
export function cloudTransport(
  client: SupabaseClient,
  owner: string,
): SyncTransport & {
  pull(signal: AbortSignal): Promise<ReturnType<typeof decodeSnapshot>>;
} {
  return {
    async push(operation, signal) {
      if (operation.owner !== owner) throw Error("Owner mismatch");
      signal.throwIfAborted();
      const { data, error } = await client
        .rpc("euzen_sync_push", { op: operation })
        .abortSignal(signal);
      if (error) throw error;
      signal.throwIfAborted();
      return ack.parse(data);
    },
    async pull(signal) {
      signal.throwIfAborted();
      const { data, error } = await client
        .rpc("euzen_sync_pull")
        .abortSignal(signal);
      if (error) throw error;
      signal.throwIfAborted();
      return decodeSnapshot(data, owner);
    },
  };
}
