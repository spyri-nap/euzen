import { describe, expect, it } from "vitest";
import { emptyState } from "../domain/empty";
import { canonical, changes, drain } from "./sync";
const owner = "00000000-0000-4000-8000-000000000001";
const before = emptyState();
const after = {
  ...before,
  preferences: { ...before.preferences, audio: true },
};
const ops = () => changes(owner, 1, before, after, {}, []);
describe("durable sync protocol", () => {
  it("does not upload unchanged data or depend on object key ordering", () => {
    expect(changes(owner, 1, before, structuredClone(before), {}, [])).toEqual(
      [],
    );
    expect(canonical({ a: 1, b: 2 })).toBe(canonical({ b: 2, a: 1 }));
  });
  it("keeps stable queued operations and increments dependent revisions", () => {
    const first = ops();
    const next = changes(owner, 1, after, before, {}, first);
    expect(next[0].expectedRevision).toBe(1);
    expect(next[0].id).not.toBe(first[0].id);
    expect(first[0].payload?.audio).toBe(true);
  });
  it("emits tombstones", () => {
    const s = {
      ...before,
      weeklyPlans: [{ id: "week", name: "Test", startDate: "2026-10-28" }],
    };
    expect(changes(owner, 1, s, before, {}, [])[0]).toMatchObject({
      remove: true,
      payload: null,
      kind: "week",
    });
  });
  it("does not acknowledge failed uploads", async () => {
    let ack = 0;
    await expect(
      drain(
        ops(),
        {
          push: async () => {
            throw Error("offline");
          },
        },
        new AbortController().signal,
        async () => {
          ack++;
        },
      ),
    ).rejects.toThrow("offline");
    expect(ack).toBe(0);
  });
  it("preserves both versions and stops at the first conflict", async () => {
    let ack = 0;
    const result = await drain(
      ops(),
      {
        push: async () => ({
          kind: "conflict",
          server: { audio: false },
          revision: 2,
        }),
      },
      new AbortController().signal,
      async () => {
        ack++;
      },
    );
    expect(result?.operation.payload?.audio).toBe(true);
    expect(result?.server).toEqual({ audio: false });
    expect(ack).toBe(0);
  });
  it("ignores late acknowledgements after account switch", async () => {
    const controller = new AbortController();
    let ack = 0;
    await expect(
      drain(
        ops(),
        {
          push: async () => {
            controller.abort();
            return { kind: "accepted", revision: 1 };
          },
        },
        controller.signal,
        async () => {
          ack++;
        },
      ),
    ).rejects.toThrow();
    expect(ack).toBe(0);
  });
  it("acknowledges only verified revisions", async () => {
    let ack = 0;
    await expect(
      drain(
        ops(),
        { push: async () => ({ kind: "accepted", revision: 4 }) },
        new AbortController().signal,
        async () => {
          ack++;
        },
      ),
    ).rejects.toThrow("Invalid acknowledgement");
    expect(ack).toBe(0);
  });
});
