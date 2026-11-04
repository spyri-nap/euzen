// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requestCode: vi.fn(async () => "qa@example.test"),
}));
vi.mock("../data/client", () => ({
  accountSyncEnabled: false,
  client: {
    auth: {
      onAuthStateChange: (callback: (event: string, session: null) => void) => {
        callback("INITIAL_SESSION", null);
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  },
}));
vi.mock("../data/auth", () => ({
  AccountError: class extends Error {},
  AccountService: class {
    retryAt = 0;
    requestCode = mocks.requestCode;
  },
}));
import { Account } from "./Account";

it("requires explicit privacy and participation and never requests a code before valid input", async () => {
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
  const button = (text: string) =>
    [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    )!;
  try {
    await act(async () => root.render(<Account />));
    const consent = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!;
    expect(consent.disabled).toBe(true);
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(mocks.requestCode).not.toHaveBeenCalled();
    await act(async () => button("Datenschutz lesen").click());
    await act(async () =>
      container
        .querySelector("dialog")!
        .dispatchEvent(
          new Event("cancel", { bubbles: true, cancelable: true }),
        ),
    );
    expect(consent.disabled).toBe(true);
    await act(async () => button("Datenschutz lesen").click());
    await act(async () => button("gelesen und verstanden").click());
    expect(consent.disabled).toBe(false);
    expect(button("Code anfordern").disabled).toBe(true);
    await act(async () => consent.click());
    expect(button("Code anfordern").disabled).toBe(true);
    const email = container.querySelector<HTMLInputElement>(
      'input[type="email"]',
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(email, "qa@example.test");
      email.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(button("Code anfordern").disabled).toBe(false);
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        ),
    );
    expect(mocks.requestCode).toHaveBeenCalledExactlyOnceWith(
      "qa@example.test",
    );
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
