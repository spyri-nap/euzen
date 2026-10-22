import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { loadState, parseBackup, saveState } from "./storage";
import { initialState } from "../domain/seed";

describe("IndexedDB persistence", () => {
  it("preserves data across loads and never writes an invalid import", async () => {
    const state = initialState();
    state.templates[0].name = "Mein gespeichertes Training";
    await saveState(state);
    expect((await loadState()).templates[0].name).toBe(
      "Mein gespeichertes Training",
    );
    expect(() => parseBackup('{"schemaVersion":999}')).toThrow();
    expect(await loadState()).toEqual(state);
  });
  it("rejects invalid writes atomically and keeps the last valid state", async () => {
    const before = await loadState();
    const bad = initialState();
    bad.templates[0].blocks[0].work = -1;
    await expect(saveState(bad)).rejects.toThrow();
    expect(await loadState()).toEqual(before);
  });
});
