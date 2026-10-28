// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { emptyState } from "../domain/empty";
import { saveState, loadState } from "./storage";
import { loadAccount } from "./accountStore";
const harness = vi.hoisted(() => ({
  callback: null as null | ((event: string, session: unknown) => void),
  pull: vi.fn(),
  push: vi.fn(),
}));
vi.mock("./client", () => ({
  accountSyncEnabled: true,
  client: {
    auth: {
      onAuthStateChange: (cb: typeof harness.callback) => {
        harness.callback = cb;
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                harness.callback = null;
              },
            },
          },
        };
      },
    },
  },
}));
vi.mock("./cloud", () => ({
  cloudTransport: () => ({ pull: harness.pull, push: harness.push }),
}));
import { useStore } from "./useStore";
let store: ReturnType<typeof useStore>;
let root: Root;
let container: HTMLDivElement;
const owner = "60000000-0000-4000-8000-000000000001";
const other = "60000000-0000-4000-8000-000000000002";
function Probe() {
  store = useStore();
  return <div>{store.state?.weeklyPlans.map((x) => x.name).join(",")}</div>;
}
async function settle() {
  for (let i = 0; i < 12; i++)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
}
async function signIn(id: string | null) {
  await act(async () => {
    harness.callback?.("SIGNED_IN", id ? { user: { id } } : null);
  });
  await settle();
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  harness.pull.mockReset();
  harness.push.mockReset();
  harness.push.mockImplementation(async (op) => ({
    kind: "accepted",
    revision: op.expectedRevision + 1,
  }));
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: emptyState(),
    revisions: {},
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Probe />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
it("loads a confirmed empty account, writes to its partition and restores the untouched guest on logout", async () => {
  const guest = {
    ...emptyState(),
    weeklyPlans: [
      { id: "guest-week", name: "Guest only", startDate: "2026-10-28" },
    ],
  };
  await saveState(guest);
  await signIn(owner);
  expect(store.state?.weeklyPlans).toEqual([]);
  // Block transport so a local edit can be inspected before any cloud pull.
  harness.push.mockRejectedValue(new TypeError("network unavailable"));
  await act(async () =>
    store.update((s) => ({
      ...s,
      weeklyPlans: [{ id: "own-week", name: "Own", startDate: "2026-10-28" }],
    })),
  );
  await settle();
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe("Own");
  expect((await loadAccount(owner))?.outbox.length).toBeGreaterThan(0);
  expect(await loadState()).toEqual(guest);
  await signIn(null);
  expect(store.state?.weeklyPlans[0].name).toBe("Guest only");
});
it("ignores a late initial pull after changing accounts", async () => {
  let finish!: (value: unknown) => void;
  harness.pull.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await signIn(other);
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: emptyState(),
    revisions: {},
  });
  await signIn(owner);
  await act(async () =>
    finish({
      owner: other,
      generation: 1,
      state: {
        ...emptyState(),
        weeklyPlans: [
          { id: "secret", name: "Other account", startDate: "2026-10-28" },
        ],
      },
      revisions: {},
    }),
  );
  await settle();
  expect(container.textContent).not.toContain("Other account");
  expect(store.accountOwner).toBe(owner);
});
