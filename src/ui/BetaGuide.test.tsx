// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { BetaGuide, guides } from "./BetaGuide";

it("keeps complete guide structures in all three languages", () => {
  for (const copy of Object.values(guides)) {
    expect(Object.keys(copy).sort()).toEqual(Object.keys(guides.de).sort());
    expect(copy.steps).toHaveLength(10);
    expect(copy.labels).toHaveLength(8);
    expect(copy.levels).toHaveLength(4);
    expect([...copy.steps, ...copy.labels, copy.warning].every(Boolean)).toBe(
      true,
    );
  }
});

it("restores Greek and builds feedback only from explicit form entries", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const storage = new Map([["euzen-beta-language", "el"]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<BetaGuide />));
    expect(container.querySelector("section")?.lang).toBe("el");
    const draft =
      container.querySelector<HTMLAnchorElement>('a[href^="mailto:"]')!;
    expect(decodeURIComponent(draft.href)).toContain("Language: el");
    expect(draft.href).not.toContain("attachment");
    const select = container.querySelector("select")!;
    await act(async () => {
      select.value = "en";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(storage.get("euzen-beta-language")).toBe("en");
    expect(container.querySelector("section")?.lang).toBe("en");
    expect(
      container.querySelector('a[href="/datenschutz.html"]'),
    ).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
