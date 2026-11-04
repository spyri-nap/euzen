import { describe, it, expect } from "vitest";
import workerSource from "../../scripts/sw.js?raw";
function worker(fail = false) {
  const handlers: Record<string, (e: any) => void> = {};
  const deleted: string[] = [];
  const added: string[][] = [];
  const script = workerSource
    .replace("__BUILD__", "test")
    .replace("__ASSETS__", JSON.stringify(["/index.html", "/assets/app.js"]));
  const self = {
    location: { origin: "https://example.test" },
    addEventListener: (type: string, fn: (e: any) => void) =>
      (handlers[type] = fn),
  };
  const context = {
    self,
    URL,
    caches: {
      open: async () => ({
        addAll: async (a: string[]) => {
          added.push(a);
          if (fail) throw Error("offline");
        },
        match: async () => ({ ok: true }),
      }),
      delete: async (name: string) => {
        deleted.push(name);
      },
    },
    fetch: () => {
      throw Error("unexpected fetch");
    },
  };
  new Function(...Object.keys(context), script)(...Object.values(context));
  return { handlers, deleted, added };
}
describe("production worker safety", () => {
  it("precaches only the build inventory", async () => {
    const w = worker();
    let job: Promise<void> | undefined;
    w.handlers.install({ waitUntil: (p: Promise<void>) => (job = p) });
    await job;
    expect(w.added).toEqual([["/index.html", "/assets/app.js"]]);
  });
  it("removes only the failed new cache and propagates failure", async () => {
    const w = worker(true);
    let job: Promise<void> | undefined;
    w.handlers.install({ waitUntil: (p: Promise<void>) => (job = p) });
    await expect(job).rejects.toThrow("offline");
    expect(w.deleted).toEqual(["euzen-shell-test"]);
  });
  it("does not intercept third party traffic, writes or update scripts", () => {
    const w = worker();
    for (const [url, method] of [
      ["https://other.test/x", "GET"],
      ["https://example.test/x", "POST"],
      ["https://example.test/sw.js", "GET"],
    ]) {
      let intercepted = false;
      w.handlers.fetch({
        request: { url, method, mode: "cors" },
        respondWith: () => (intercepted = true),
      });
      expect(intercepted).toBe(false);
    }
  });
  it("never exposes an immediate-activation message", () => {
    const w = worker();
    w.handlers.message({ data: { type: "SKIP_WAITING" } });
    expect(w.handlers.activate).toBeUndefined();
  });
  it("reports a build only from an installed worker", () => {
    const w = worker();
    let result: unknown;
    w.handlers.message({
      data: { type: "STATUS" },
      ports: [{ postMessage: (v: unknown) => (result = v) }],
    });
    expect(result).toEqual({ build: "test", ready: true });
  });
});
