import { z } from "zod";
import { templateSchema, type WorkoutTemplate } from "../domain/model";
import { type EditBasis, getEditBasis, attachEditBasis } from "./editBasis";
const basisSchema = z.object({
  owner: z.uuid(),
  generation: z.number().int().positive(),
  revision: z.number().int().nonnegative(),
});
const envelope = z.object({
  version: z.literal(1),
  scope: z.string(),
  template: templateSchema,
  basis: basisSchema.nullable(),
});
export const draftKey = (scope: string, id: string) =>
  `euzen-builder:v2:${scope}:${id}`;
export function encodeDraft(
  scope: string,
  template: WorkoutTemplate,
  basis: EditBasis | null,
) {
  return JSON.stringify(envelope.parse({ version: 1, scope, template, basis }));
}
export function decodeDraft(
  raw: string,
  scope: string,
  currentBasis: EditBasis | null,
  exerciseIds: string[],
) {
  const data = envelope.parse(JSON.parse(raw));
  if (
    data.scope !== scope ||
    (currentBasis &&
      (data.basis?.owner !== currentBasis.owner ||
        data.basis.generation !== currentBasis.generation))
  )
    throw Error("Draft account mismatch");
  if (
    data.template.blocks.some((b) =>
      b.exercises.some((e) => !exerciseIds.includes(e.exerciseId)),
    )
  )
    throw Error("Draft references missing exercise");
  return { template: data.template, basis: data.basis };
}
export function saveDraftTemplate(
  original: WorkoutTemplate | undefined,
  updated: WorkoutTemplate,
  basis: EditBasis | null,
) {
  return attachEditBasis(
    updated,
    basis ?? (original ? getEditBasis(original) : null),
  );
}
