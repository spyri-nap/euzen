import { useSyncExternalStore } from "react";
import { english } from "./locales/en";
export type Language = "de" | "en";
let language: Language = "de";
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const getLocale = () => (language === "en" ? "en-GB" : "de-DE");
export function setLanguage(value: Language) {
  if (value === language) return;
  language = value;
  if (typeof document !== "undefined") {
    document.documentElement.lang = value;
    document.title =
      value === "en"
        ? "Eúzēn · Live well. Keep moving."
        : "Eúzēn · Gut leben. In Bewegung bleiben.";
  }
  listeners.forEach((fn) => fn());
}
export function useLanguage() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getLanguage,
    getLanguage,
  );
}
/** Only explicit UI copy is translated. Never pass user-authored data here. */
export function t(source: string): string {
  if (language === "de") return source;
  const trimmed = source.trim();
  const translated = english[trimmed];
  return translated === undefined
    ? source
    : source.replace(trimmed, () => translated);
}
