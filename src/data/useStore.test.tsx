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
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase("euzen-accounts");
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (
        _name: unknown,
        _options: unknown,
        callback: (lock: object) => unknown,
      ) => Promise.resolve(callback({ name: "test-editor" })),
    },
  });
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

it("returns a durable import result and preserves the source through repeat imports", async () => {
  const guest = {
    ...emptyState(),
    weeklyPlans: [{ id: "week", name: "Guest week", startDate: "2026-10-28" }],
  };
  await saveState(guest);
  await signIn(owner);
  harness.push.mockRejectedValue({ code: "54000", message: "quota" });
  let success = false;
  await act(async () => {
    success = await store.importGuest();
  });
  await settle();
  expect(success).toBe(true);
  expect((await loadAccount(owner))?.state.weeklyPlans).toHaveLength(1);
  await act(async () => {
    success = await store.importGuest();
  });
  await settle();
  expect(success).toBe(true);
  expect((await loadAccount(owner))?.state.weeklyPlans).toHaveLength(1);
  expect(await loadState()).toEqual(guest);
});
it("reports an offline initial account without fabricating or persisting an empty account", async () => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  try {
    await signIn(other);
    expect(store.state).toBeNull();
    expect(store.syncStatus).toBe("offline");
    expect(await loadAccount(other)).toBeNull();
    expect(harness.pull).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  }
});

it("does not overwrite a local edit made during an in-flight cloud pull", async () => {
  await signIn(owner);
  let finish!: (value: unknown) => void;
  harness.pull.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await act(async () => store.retry());
  await settle();
  harness.push.mockRejectedValue({ code: "54000", message: "quota" });
  await act(async () =>
    store.update((s) => ({
      ...s,
      weeklyPlans: [
        { id: "during-pull", name: "Keep me", startDate: "2026-10-28" },
      ],
    })),
  );
  await settle();
  await act(async () =>
    finish({ owner, generation: 1, state: emptyState(), revisions: {} }),
  );
  await settle();
  expect(store.state?.weeklyPlans[0].name).toBe("Keep me");
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe("Keep me");
});

it("preserves the editing base while a dialog is open and resumes pull after closing", async () => {
  await signIn(owner);
  const { holdEditor } = await import("./editGuard");
  const release = holdEditor();
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: {
      ...emptyState(),
      weeklyPlans: [
        { id: "remote", name: "Remote revision", startDate: "2026-10-28" },
      ],
    },
    revisions: {},
  });
  await act(async () => store.retry());
  await settle();
  expect(store.state?.weeklyPlans).toEqual([]);
  await act(async () => release());
  await settle();
  expect(store.state?.weeklyPlans[0].name).toBe("Remote revision");
});

it("regression: a stale form keeps its opening revision even after a newer snapshot was pulled", async () => {
  const { withEditBasis } = await import("./editBasis");
  const key = JSON.stringify(["week", "stale-form"]);
  const initial = { id: "stale-form", name: "Base", startDate: "2026-10-28" };
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [initial] },
    revisions: { [key]: 1 },
  });
  await signIn(owner);
  const opening = store.state!.weeklyPlans[0];
  const remote = { ...initial, name: "Client B" };
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [remote] },
    revisions: { [key]: 2 },
  });
  await act(async () => store.retry());
  await settle();
  expect(store.state!.weeklyPlans[0].name).toBe("Client B");
  harness.push.mockResolvedValue({
    kind: "conflict",
    revision: 2,
    server: remote,
  });
  await act(async () =>
    store.update((s) => ({
      ...s,
      weeklyPlans: [withEditBasis(opening, { ...opening, name: "Client A" })],
    })),
  );
  await settle();
  expect(harness.push.mock.calls.at(-1)?.[0].expectedRevision).toBe(1);
  expect(store.syncStatus).toBe("conflict");
  expect(store.conflict?.server?.name).toBe("Client B");
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe(
    "Client A",
  );
});

it("halts old-generation uploads and archives unsent work during explicit recovery", async () => {
  await signIn(owner);
  harness.push.mockRejectedValue({ code: "54000", message: "quota" });
  await act(async () =>
    store.update((s) => ({
      ...s,
      weeklyPlans: [
        { id: "offline-generation", name: "Preserve", startDate: "2026-10-28" },
      ],
    })),
  );
  await settle();
  harness.push.mockClear();
  harness.pull.mockResolvedValue({
    owner,
    generation: 2,
    state: emptyState(),
    revisions: {},
  });
  await act(async () => store.retry());
  await settle();
  expect(store.syncStatus).toBe("generation");
  expect(harness.push).not.toHaveBeenCalled();
  expect((await loadAccount(owner))?.outbox.length).toBeGreaterThan(0);
  let success = false;
  await act(async () => {
    success = await store.recoverGeneration();
  });
  await settle();
  expect(success).toBe(true);
  expect(store.accountGeneration).toBe(2);
  expect(
    (await (await import("./accountStore")).latestRecovery(owner))
      ?.weeklyPlans[0].name,
  ).toBe("Preserve");
});
it("retains a conflicted local version while choosing server and keeps subsequent conflicts actionable", async () => {
  const base = { id: "conflict-week", name: "Base", startDate: "2026-10-28" };
  const key = JSON.stringify(["week", base.id]);
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [base] },
    revisions: { [key]: 1 },
  });
  await signIn(owner);
  harness.push.mockResolvedValue({
    kind: "conflict",
    revision: 2,
    server: { ...base, name: "Server" },
  });
  await act(async () =>
    store.update((s) => ({ ...s, weeklyPlans: [{ ...base, name: "Local" }] })),
  );
  await settle();
  expect(store.conflict?.server?.name).toBe("Server");
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [{ ...base, name: "Server" }] },
    revisions: { [key]: 2 },
  });
  await act(async () => store.resolve("server"));
  await settle();
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe("Server");
  harness.push.mockResolvedValue({
    kind: "conflict",
    revision: 3,
    server: { ...base, name: "Server newer" },
  });
  await act(async () =>
    store.update((s) => ({
      ...s,
      weeklyPlans: [{ ...base, name: "Local again" }],
    })),
  );
  await settle();
  expect(store.conflict?.revision).toBe(3);
  await act(async () => store.resolve("local"));
  await settle();
  expect(store.conflict?.server?.name).toBe("Server newer");
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe(
    "Local again",
  );
});

it("replays the identical operation after an acknowledgement was lost and the app restarted", async () => {
  await signIn(owner);
  const committed = {
    id: "lost-ack",
    name: "Server accepted",
    startDate: "2026-10-28",
  };
  const key = JSON.stringify(["week", committed.id]);
  let operationId = "";
  harness.push.mockImplementationOnce(async (op) => {
    operationId = op.id;
    throw new TypeError("response lost after commit");
  });
  await act(async () =>
    store.update((s) => ({ ...s, weeklyPlans: [committed] })),
  );
  await settle();
  expect((await loadAccount(owner))?.outbox[0].id).toBe(operationId);
  await act(async () => root.unmount());
  root = createRoot(container);
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [committed] },
    revisions: { [key]: 1 },
  });
  harness.push.mockImplementation(async (op) => {
    expect(op.id).toBe(operationId);
    return { kind: "accepted", revision: 1 };
  });
  await act(async () => root.render(<Probe />));
  await signIn(owner);
  expect((await loadAccount(owner))?.outbox).toEqual([]);
  expect(store.state?.weeklyPlans).toHaveLength(1);
  expect(store.syncStatus).toBe("synced");
});
it("keeps unsaved edits on local storage failure and retries before any cloud pull", async () => {
  await signIn(owner);
  const module = await import("./accountStore");
  const stage = vi
    .spyOn(module, "stageAccount")
    .mockRejectedValueOnce(new Error("disk full"));
  harness.push.mockRejectedValue({ code: "54000", message: "quota" });
  try {
    let result = true;
    await act(async () => {
      result = await store.update((s) => ({
        ...s,
        weeklyPlans: [
          { id: "disk-full", name: "Still here", startDate: "2026-10-28" },
        ],
      }));
    });
    await settle();
    expect(result).toBe(false);
    expect(store.state?.weeklyPlans[0].name).toBe("Still here");
    expect(store.error).not.toBe("");
    expect((await loadAccount(owner))?.state.weeklyPlans).toEqual([]);
    await act(async () => store.retry());
    await settle();
    expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe(
      "Still here",
    );
    expect((await loadAccount(owner))?.outbox.length).toBeGreaterThan(0);
  } finally {
    stage.mockRestore();
  }
});

it("keeps account training available when authentication expires and resumes after signing in again", async () => {
  await signIn(owner);
  await act(async () => {
    harness.callback?.("SIGNED_OUT", null);
  });
  await settle();
  expect(store.syncStatus).toBe("auth");
  expect(store.accountOwner).toBe(owner);
  expect(store.state).not.toBeNull();
  harness.push.mockClear();
  await act(async () =>
    store.update((s) => ({
      ...s,
      weeklyPlans: [
        {
          id: "expired",
          name: "Offline after expiry",
          startDate: "2026-10-28",
        },
      ],
    })),
  );
  await settle();
  expect(harness.push).not.toHaveBeenCalled();
  expect((await loadAccount(owner))?.state.weeklyPlans[0].name).toBe(
    "Offline after expiry",
  );
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: {
      ...emptyState(),
      weeklyPlans: [
        {
          id: "expired",
          name: "Offline after expiry",
          startDate: "2026-10-28",
        },
      ],
    },
    revisions: { [JSON.stringify(["week", "expired"])]: 1 },
  });
  await signIn(owner);
  expect(harness.push).toHaveBeenCalled();
  expect(store.syncStatus).toBe("synced");
});

it("preserves the original form revision through a failed local save and retry", async () => {
  const { withEditBasis } = await import("./editBasis");
  const key = JSON.stringify(["week", "failed-base"]);
  const base = { id: "failed-base", name: "Base", startDate: "2026-10-28" };
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [base] },
    revisions: { [key]: 1 },
  });
  await signIn(owner);
  const opening = store.state!.weeklyPlans[0];
  harness.pull.mockResolvedValue({
    owner,
    generation: 1,
    state: { ...emptyState(), weeklyPlans: [{ ...base, name: "Remote" }] },
    revisions: { [key]: 2 },
  });
  await act(async () => store.retry());
  await settle();
  const module = await import("./accountStore");
  const stage = vi
    .spyOn(module, "stageAccount")
    .mockRejectedValueOnce(new Error("disk full"));
  try {
    await act(async () =>
      store.update((s) => ({
        ...s,
        weeklyPlans: [
          withEditBasis(opening, { ...opening, name: "Stale local" }),
        ],
      })),
    );
    await settle();
    harness.push.mockResolvedValue({
      kind: "conflict",
      revision: 2,
      server: { ...base, name: "Remote" },
    });
    await act(async () => store.retry());
    await settle();
    expect(harness.push.mock.calls.at(-1)?.[0].expectedRevision).toBe(1);
    expect(store.syncStatus).toBe("conflict");
  } finally {
    stage.mockRestore();
  }
});
