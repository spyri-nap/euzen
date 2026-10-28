// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { loadState, saveState } from "./storage";
import { emptyState } from "../domain/empty";
vi.mock("./client", () => ({ accountSyncEnabled: false, client: null }));
import { useStore } from "./useStore";
import { App } from "../App";
it("refuses writes without the document lease and disables settings mutation controls", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.scrollTo = vi.fn();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (_n: unknown, _o: unknown, callback: (lock: null) => unknown) =>
        Promise.resolve(callback(null)),
    },
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  await saveState(emptyState());
  let store!: ReturnType<typeof useStore>;
  function Probe() {
    store = useStore();
    return null;
  }
  const container = document.createElement("div");
  document.body.append(container);
  let root = createRoot(container);
  const settle = async () => {
    for (let i = 0; i < 8; i++)
      await act(async () => {
        await new Promise((r) => setTimeout(r, 5));
      });
  };
  try {
    await act(async () => root.render(<Probe />));
    await settle();
    expect(store.readonly).toBe(true);
    expect(
      await store.update((s) => ({
        ...s,
        preferences: { ...s.preferences, audio: true },
      })),
    ).toBe(false);
    expect((await loadState()).preferences.audio).toBe(false);
    await act(async () => root.unmount());
    root = createRoot(container);
    await act(async () => root.render(<App />));
    await settle();
    const settings = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Einstellungen & Daten"),
    ) as HTMLButtonElement;
    expect(settings, container.textContent ?? "").not.toBeNull();
    await act(async () => settings.click());
    await settle();
    const dialog = container.querySelector("dialog")!;
    expect(dialog).not.toBeNull();
    expect(
      Array.from(dialog.querySelectorAll("input,select")).every((el) =>
        el.matches(":disabled"),
      ),
    ).toBe(true);
    expect(
      (
        dialog.querySelector(
          'button[aria-label="Schließen"]',
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
