import type { AppState } from "../domain/model";
import { entities, entityKey } from "./sync";
import type { PendingOperation } from "./accountStore";
export type EditBasis = { owner: string; generation: number; revision: number };
const known = new WeakMap<object, EditBasis>();
const edits = new WeakMap<object, EditBasis>();
/** Record immutable bases on objects shown to the user, never retrofit an open form. */
export function registerEditBases(
  state: AppState,
  owner: string,
  generation: number,
  revisions: Record<string, number>,
  outbox: PendingOperation[],
) {
  for (const entity of entities(state)) {
    const key = entityKey(entity.kind, entity.id);
    if (!known.has(entity.payload))
      known.set(entity.payload, {
        owner,
        generation,
        revision:
          (revisions[key] ?? 0) +
          outbox.filter((op) => entityKey(op.kind, op.entityId) === key).length,
      });
  }
}
export function withEditBasis<T extends object>(original: T, updated: T): T {
  const basis = known.get(original);
  if (basis) edits.set(updated, basis);
  return updated;
}
export function editExpectations(
  state: AppState,
  owner: string | null,
  generation: number,
) {
  const result: Record<string, number> = {};
  for (const entity of entities(state)) {
    const basis = edits.get(entity.payload);
    if (!basis) continue;
    if (basis.owner !== owner || basis.generation !== generation)
      throw Error("Stale editing account");
    result[entityKey(entity.kind, entity.id)] = basis.revision;
  }
  return result;
}
