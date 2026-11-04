import { expect, it } from "vitest";
import source from "../../scripts/sw.js?raw";

it("keeps the old shell and lazy assets usable while a new build installs offline-safely", async () => {
  const stores = new Map<string, Map<string, string>>();
  const caches = {
    open: async (name: string) => {
      const entries = stores.get(name) ?? new Map<string, string>();
      stores.set(name, entries);
      return {
        addAll: async (assets: string[]) => {
          for (const asset of assets) entries.set(asset, name + asset);
        },
        match: async (path: string) => entries.get(path),
      };
    },
    delete: async (name: string) => stores.delete(name),
  };
  function build(version: string) {
    const handlers: Record<string, (event: any) => void> = {};
    new Function(
      "self",
      "caches",
      "URL",
      "fetch",
      source
        .replace("__BUILD__", version)
        .replace(
          "__ASSETS__",
          JSON.stringify([
            "/index.html",
            `/assets/lazy-${version}.js`,
            "/datenschutz.html",
            "/privacy-en.html",
          ]),
        ),
    )(
      {
        location: { origin: "https://qa.test" },
        addEventListener: (type: string, fn: (event: any) => void) =>
          (handlers[type] = fn),
      },
      caches,
      URL,
      () => {
        throw Error("network unavailable");
      },
    );
    return handlers;
  }
  async function install(handlers: ReturnType<typeof build>) {
    let pending: Promise<void> | undefined;
    handlers.install({ waitUntil: (p: Promise<void>) => (pending = p) });
    await pending;
  }
  async function read(
    handlers: ReturnType<typeof build>,
    path: string,
    mode = "navigate",
  ) {
    let response: Promise<string> | undefined;
    handlers.fetch({
      request: { url: "https://qa.test" + path, method: "GET", mode },
      respondWith: (p: Promise<string>) => (response = p),
    });
    return response;
  }
  const old = build("old");
  await install(old);
  const next = build("next");
  await install(next);
  expect(await read(old, "/")).toBe("euzen-shell-old/index.html");
  expect(await read(old, "/assets/lazy-old.js", "cors")).toBe(
    "euzen-shell-old/assets/lazy-old.js",
  );
  expect(await read(next, "/")).toBe("euzen-shell-next/index.html");
  expect(await read(next, "/privacy-en.html")).toBe(
    "euzen-shell-next/privacy-en.html",
  );
  expect(stores.size).toBe(2);
  expect(next.activate).toBeUndefined();
});
