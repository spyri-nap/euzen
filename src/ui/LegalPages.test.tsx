// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { LegalPages } from "./LegalPages";
import { Modal } from "./common";

it("keeps complete privacy content and cancels only the top dialog", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const parentClose = vi.fn(),
    childClose = vi.fn(),
    confirm = vi.fn();
  try {
    await act(async () =>
      root.render(
        <Modal title="Settings" onClose={parentClose}>
          <LegalPages page="privacy" onClose={childClose} onConfirm={confirm} />
        </Modal>,
      ),
    );
    expect(container.textContent).toContain("Gerätespeicher und Backups");
    expect(container.textContent).toContain("Zweck und Speicherdauer");
    expect(confirm).not.toHaveBeenCalled();
    await act(async () =>
      container
        .querySelectorAll("dialog")[1]
        .dispatchEvent(
          new Event("cancel", { bubbles: true, cancelable: true }),
        ),
    );
    expect(childClose).toHaveBeenCalledOnce();
    expect(parentClose).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
