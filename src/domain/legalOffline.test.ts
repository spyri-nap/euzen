import { expect, it } from "vitest";
import source from "../../scripts/sw.js?raw";
it("serves precached legal documents for navigation instead of the app shell", async () => {
  const handlers: Record<string, (event: any) => void> = {};
  const script = source
    .replace("__BUILD__", "test")
    .replace(
      "__ASSETS__",
      JSON.stringify(["/index.html", "/datenschutz.html", "/impressum.html"]),
    );
  const cache = { match: async (path: string) => path };
  new Function("self", "caches", "URL", script)(
    {
      location: { origin: "https://test.local" },
      addEventListener: (name: string, handler: (event: any) => void) => {
        handlers[name] = handler;
      },
    },
    { open: async () => cache },
    URL,
  );
  for (const [path, expected] of [
    ["/datenschutz.html", "/datenschutz.html"],
    ["/impressum.html", "/impressum.html"],
    ["/", "/index.html"],
  ]) {
    let response: Promise<string> | undefined;
    handlers.fetch({
      request: {
        method: "GET",
        mode: "navigate",
        url: `https://test.local${path}`,
      },
      respondWith: (value: Promise<string>) => {
        response = value;
      },
    });
    expect(await response).toBe(expected);
  }
});
