import { expect, it } from "vitest";
import { initialState } from "../domain/seed";
import { registerEditBases, editExpectations } from "./editBasis";
import {
  draftKey,
  encodeDraft,
  decodeDraft,
  saveDraftTemplate,
} from "./workoutDraft";
const owner = "80000000-0000-4000-8000-000000000001";
it("partitions drafts by account and generation and preserves opening revision across reload", () => {
  const state = initialState();
  const t = state.templates[0];
  const key = JSON.stringify(["workout", t.id]);
  registerEditBases(state, owner, 1, { [key]: 3 }, []);
  const basis = { owner, generation: 1, revision: 3 };
  const scope = owner + ":1";
  const raw = encodeDraft(scope, { ...t, name: "Unsaved changes" }, basis);
  const restored = decodeDraft(
    raw,
    scope,
    { ...basis, revision: 7 },
    state.exercises.map((e) => e.id),
  );
  const saved = saveDraftTemplate(t, restored.template, restored.basis);
  expect(
    editExpectations(
      {
        ...state,
        templates: state.templates.map((x) => (x.id === saved.id ? saved : x)),
      },
      owner,
      1,
    )[key],
  ).toBe(3);
  expect(draftKey(scope, t.id)).not.toBe(draftKey(owner + ":2", t.id));
  expect(() =>
    decodeDraft(
      raw,
      owner + ":2",
      { ...basis, generation: 2 },
      state.exercises.map((e) => e.id),
    ),
  ).toThrow();
  expect(() =>
    decodeDraft(
      raw,
      "guest:0",
      null,
      state.exercises.map((e) => e.id),
    ),
  ).toThrow();
});
