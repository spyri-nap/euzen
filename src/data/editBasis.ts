import type { AppState } from "../domain/model";
import { entities, entityKey } from "./sync";
import type { PendingOperation } from "./accountStore";
export type EditBasis = { owner: string; generation: number; revision: number };
const known = new WeakMap<object, EditBasis>();
const states = new WeakMap<
  AppState,
  { owner: string; generation: number; revisions: Record<string, number> }
>();
const edits = new WeakMap<object, EditBasis>();
const replacements = new WeakMap<AppState, AppState>();
/** Record immutable bases on objects shown to the user, never retrofit an open form. */
export function registerEditBases(
  state: AppState,
  owner: string,
  generation: number,
  revisions: Record<string, number>,
  outbox: PendingOperation[],
) {
  const logical = { ...revisions };
  for (const op of outbox) {
    const key = entityKey(op.kind, op.entityId);
    logical[key] = (logical[key] ?? 0) + 1;
  }
  if (!states.has(state))
    states.set(state, { owner, generation, revisions: logical });
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
  previous?: AppState,
) {
  const result: Record<string, number> = {};
  const opening = replacements.get(state);
  if (opening) {
    const basis = states.get(opening);
    if (owner && !basis) throw Error("Wait for local save before restoring");
    if (basis) {
      if (basis.owner !== owner || basis.generation !== generation)
        throw Error("Stale editing account");
      for (const entity of [
        ...entities(previous ?? state),
        ...entities(state),
      ]) {
        const key = entityKey(entity.kind, entity.id);
        result[key] = basis.revisions[key] ?? 0;
      }
    }
  }

  for (const entity of entities(state)) {
    const basis = edits.get(entity.payload);
    if (!basis) continue;
    if (basis.owner !== owner || basis.generation !== generation)
      throw Error("Stale editing account");
    result[entityKey(entity.kind, entity.id)] = basis.revision;
  }
  return result;
}

export const getEditBasis = (value: object): EditBasis | null =>
  known.get(value) ?? null;
export function attachEditBasis<T extends object>(
  updated: T,
  basis: EditBasis | null,
): T {
  if (basis) edits.set(updated, basis);
  return updated;
}

export function withStateEditBasis<T extends object>(
  state: AppState,
  kind: PendingOperation["kind"],
  id: string,
  updated: T,
): T {
  const basis = states.get(state);
  if (basis)
    edits.set(updated, {
      owner: basis.owner,
      generation: basis.generation,
      revision: basis.revisions[entityKey(kind, id)] ?? 0,
    });
  return updated;
}

export function withReplacementBasis(opening: AppState, restored: AppState) {
  replacements.set(restored, opening);
  return restored;
}
