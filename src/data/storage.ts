import { openDB } from "idb";
import { validateState, type AppState } from "../domain/model";
import { initialState } from "../domain/seed";

const connection = () =>
  openDB("euzen", 1, {
    upgrade(db) {
      db.createObjectStore("state");
    },
  });
export async function loadState(): Promise<AppState> {
  const db = await connection();
  try {
    const stored = await db.get("state", "main");
    return stored === undefined ? initialState() : validateState(stored);
  } finally {
    db.close();
  }
}
export async function saveState(state: AppState) {
  const checked = validateState(state);
  const db = await connection();
  try {
    await db.put("state", checked, "main");
  } finally {
    db.close();
  }
}
export function parseBackup(text: string): AppState {
  if (text.length > 15_000_000)
    throw new Error("Die Datei ist größer als 15 MB.");
  return validateState(JSON.parse(text));
}
export function exportState(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `euzen-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
