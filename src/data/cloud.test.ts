import { expect, it } from "vitest";
import { decodeSnapshot } from "./cloud";
const owner = "10000000-0000-4000-8000-000000000001";
it("decodes a confirmed empty cloud account", () =>
  expect(
    decodeSnapshot({ owner, generation: 1, entities: [] }, owner).state
      .exercises,
  ).toEqual([]));
it("rejects another owner, duplicate rows, malformed payloads and broken references", () => {
  expect(() =>
    decodeSnapshot(
      { owner, generation: 1, entities: [] },
      "10000000-0000-4000-8000-000000000002",
    ),
  ).toThrow();
  const e = {
    kind: "week",
    id: "a",
    revision: 1,
    payload: { id: "a", name: "Week", startDate: "2026-10-28" },
  };
  expect(() =>
    decodeSnapshot({ owner, generation: 1, entities: [e, e] }, owner),
  ).toThrow();
  expect(() =>
    decodeSnapshot(
      { owner, generation: 1, entities: [{ ...e, payload: { id: "b" } }] },
      owner,
    ),
  ).toThrow();
  expect(() =>
    decodeSnapshot(
      {
        owner,
        generation: 1,
        entities: [
          {
            kind: "scheduled",
            id: "s",
            revision: 1,
            payload: {
              id: "s",
              date: "2026-10-28",
              kind: "workout",
              templateId: "missing",
              label: "Test",
            },
          },
        ],
      },
      owner,
    ),
  ).toThrow();
});
it("retains tombstone revisions without resurrecting the entity", () => {
  const result = decodeSnapshot(
    {
      owner,
      generation: 2,
      entities: [{ kind: "week", id: "old", revision: 3, payload: null }],
    },
    owner,
  );
  expect(result.state.weeklyPlans).toEqual([]);
  expect(Object.values(result.revisions)).toEqual([3]);
});
