import { afterEach, expect, it } from "vitest";
import { getLanguage, getLocale, setLanguage, t } from "./i18n";
import { stateSchema, formatDate, number } from "./domain/model";
import { initialState } from "./domain/seed";
import { parseBackup } from "./data/storage";
afterEach(() => setLanguage("de"));
it("switches interface and locale without changing unknown/user copy", () => {
  expect(t("Heute")).toBe("Heute");
  setLanguage("en");
  expect(getLocale()).toBe("en-GB");
  expect(t("Heute")).toBe("Today");
  expect(t("  Heute ")).toBe("  Today ");
  expect(t("My own workout")).toBe("My own workout");
  expect(formatDate("2026-10-23")).toContain("October");
  expect(number(1.5, 1)).toBe("1.5");
  setLanguage("de");
  expect(number(1.5, 1)).toBe("1,5");
  expect(getLanguage()).toBe("de");
});
it("defaults old backups to German and retains English in a round trip", () => {
  const state = initialState();
  const legacy = JSON.parse(JSON.stringify(state));
  delete legacy.preferences.language;
  expect(stateSchema.parse(legacy).preferences.language).toBe("de");
  state.preferences.language = "en";
  state.exercises[0].notes = "Meine eigene Notiz";
  const restored = parseBackup(JSON.stringify(state));
  expect(restored.preferences.language).toBe("en");
  expect(restored.exercises[0].notes).toBe("Meine eigene Notiz");
});
it("rejects unsupported preference values", () => {
  const state = initialState();
  expect(
    stateSchema.safeParse({
      ...state,
      preferences: { ...state.preferences, language: "xx" },
    }).success,
  ).toBe(false);
});
