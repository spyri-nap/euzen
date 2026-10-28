// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { Editor } from "./Editor";
import { initialState } from "../domain/seed";
import { draftKey } from "../data/workoutDraft";
it("retains a draft after persistence failure and removes it only after confirmed success", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const save = vi.fn().mockResolvedValue(false);
  const state = initialState();
  const key = draftKey("guest:0", "new");
  try {
    await act(async () =>
      root.render(
        <Editor
          scope="guest:0"
          exercises={state.exercises}
          onClose={() => {}}
          onSave={save}
        />,
      ),
    );
    expect(localStorage.getItem(key)).not.toBeNull();
    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(save).toHaveBeenCalledOnce();
    expect(localStorage.getItem(key)).not.toBeNull();
    expect(container.textContent).toContain("Entwurf bleibt erhalten");
    save.mockResolvedValue(true);
    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(localStorage.getItem(key)).toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    localStorage.removeItem(key);
  }
});
