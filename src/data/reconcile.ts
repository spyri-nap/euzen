import { validateState, type AppState } from "../domain/model";
import { canonical, type SyncConflict } from "./sync";
export const collections = {
  exercise: "exercises",
  workout: "templates",
  week: "weeklyPlans",
  scheduled: "scheduled",
  session: "sessions",
  checkin: "checkins",
} as const;
/** Stable namespace for an exact guest snapshot; collisions never overwrite data. */
function fingerprint(value: string) {
  let a = 2166136261,
    b = 2246822519;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b ^ value.charCodeAt(i), 3266489917);
  }
  return (
    (a >>> 0).toString(16).padStart(8, "0") +
    (b >>> 0).toString(16).padStart(8, "0")
  );
}
export function mergeGuest(target: AppState, guest: AppState): AppState {
  validateState(target);
  validateState(guest);
  const prefix = "guest-" + fingerprint(canonical(guest)) + "-";
  const idKeys = new Set([
    "id",
    "exerciseId",
    "templateId",
    "scheduledId",
    "blockId",
    "prescriptionId",
    "stepId",
  ]);
  const remap = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(remap);
    if (input && typeof input === "object")
      return Object.fromEntries(
        Object.entries(input).map(([key, value]) => [
          key,
          idKeys.has(key) && typeof value === "string"
            ? prefix + fingerprint(value)
            : remap(value),
        ]),
      );
    return input;
  };
  const source = validateState(remap(guest));
  const next = structuredClone(target);
  for (const field of Object.values(collections)) {
    const items = next[field] as unknown as Record<string, unknown>[];
    for (const input of source[field] as unknown as Record<string, unknown>[]) {
      const key = field === "checkins" ? "date" : "id";
      const existing = items.find((x) => x[key] === input[key]);
      if (existing) {
        if (canonical(existing) !== canonical(input))
          throw Error(
            field === "checkins"
              ? "Check-in date conflict: export both areas"
              : "Import ID conflict: export both areas",
          );
      } else items.push(structuredClone(input));
    }
  }
  return validateState(next);
}
export function acceptServer(
  state: AppState,
  conflict: SyncConflict,
): AppState {
  const next = structuredClone(state);
  const { kind, entityId } = conflict.operation;
  if (kind === "settings") {
    if (!conflict.server) throw Error("Settings cannot be removed");
    next.preferences = conflict.server as AppState["preferences"];
  } else {
    const field = collections[kind];
    const key = kind === "checkin" ? "date" : "id";
    const items = (next[field] as unknown as Record<string, unknown>[]).filter(
      (x) => x[key] !== entityId,
    );
    if (conflict.server) items.push(conflict.server);
    Object.assign(next, { [field]: items });
  }
  // Reject a resolution that would break other local references; preserve the outbox.
  return validateState(next);
}
