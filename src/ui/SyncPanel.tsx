import { useState } from "react";
import { getLanguage, useLanguage } from "../i18n";
import { loadState, exportState } from "../data/storage";
import type { AppState } from "../domain/model";
import type { SyncConflict } from "../data/sync";
export function syncLabel(status: string, saving: boolean) {
  const en = getLanguage() === "en";
  if (saving) return en ? "Saving locally…" : "Wird lokal gespeichert …";
  const labels: Record<string, [string, string]> = {
    guest: ["Gastbereich · lokal gespeichert", "Guest area · saved locally"],
    loading: ["Konto wird geladen …", "Loading account…"],
    pending: [
      "Lokal gespeichert · Abgleich ausstehend",
      "Saved locally · sync pending",
    ],
    synced: ["Synchronisiert", "Synced"],
    offline: ["Offline · lokal verfügbar", "Offline · available locally"],
    auth: ["Anmeldung erforderlich", "Sign-in required"],
    conflict: ["Konflikt klären", "Resolve conflict"],
    error: ["Abgleich prüfen", "Check sync"],
  };
  return (labels[status] ?? labels.error)[en ? 1 : 0];
}
export function SyncPanel({
  owner,
  status,
  saving,
  readonly,
  conflict,
  resolve,
  importGuest,
}: {
  owner: string | null;
  status: string;
  saving: boolean;
  readonly: boolean;
  conflict: SyncConflict | null;
  resolve: (choice: "local" | "server") => Promise<void>;
  importGuest: () => Promise<void>;
}) {
  useLanguage();
  const en = getLanguage() === "en";
  const [guest, setGuest] = useState<AppState | null>(null);
  const [backedUp, setBackedUp] = useState(false);
  const [error, setError] = useState("");
  return (
    <section aria-label={en ? "Synchronization" : "Synchronisierung"}>
      <p role="status" aria-live="polite">
        {syncLabel(status, saving)}
      </p>
      {conflict && (
        <div>
          <h3>
            {en ? "Choose a version" : "Fassung auswählen"} ·{" "}
            {conflict.operation.kind} / {conflict.operation.entityId}
          </h3>
          <p>
            {en
              ? "Another client changed this entry. Related local edits are kept until you choose."
              : "Ein anderer Client hat diesen Eintrag geändert. Lokale Änderungen bleiben bis zur Auswahl erhalten."}
          </p>
          <details>
            <summary>
              {en ? "Compare versions" : "Fassungen vergleichen"}
            </summary>
            <h4>
              {en ? "Local pending operation" : "Lokale ausstehende Änderung"}
            </h4>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {JSON.stringify(conflict.operation.payload, null, 2)}
            </pre>
            <h4>Server</h4>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {JSON.stringify(conflict.server, null, 2)}
            </pre>
          </details>
          <button
            className="btn"
            disabled={readonly || saving}
            onClick={() => void resolve("local")}
          >
            {en
              ? "Keep latest local version"
              : "Neueste lokale Fassung behalten"}
          </button>
          <button
            className="btn"
            disabled={readonly || saving}
            onClick={() => void resolve("server")}
          >
            {en ? "Use server version" : "Serverfassung übernehmen"}
          </button>
          <p>
            {en
              ? "Close settings to postpone without changing data. Export a backup to keep both versions."
              : "Zum Aufschieben Einstellungen schließen. Ein Backup erhält die lokale Fassung vor einer Auswahl."}
          </p>
        </div>
      )}
      {owner && (
        <>
          <button
            className="btn"
            disabled={readonly || saving}
            onClick={() => {
              setBackedUp(false);
              void loadState()
                .then(setGuest)
                .catch(() =>
                  setError(
                    en ? "Cannot read guest data" : "Gastdaten nicht lesbar",
                  ),
                );
            }}
          >
            {en ? "Review guest import" : "Gastübernahme prüfen"}
          </button>
          {guest && (
            <div>
              <p>
                {en ? "Target account" : "Zielkonto"}: {owner}
              </p>
              <p>
                {guest.exercises.length} {en ? "exercises" : "Übungen"},{" "}
                {guest.templates.length} Workouts, {guest.weeklyPlans.length}{" "}
                {en ? "plans" : "Pläne"}, {guest.sessions.length} Sessions,{" "}
                {guest.scheduled.length} {en ? "appointments" : "Termine"},{" "}
                {guest.checkins.length} Check-ins
              </p>
              <p>
                {en
                  ? "Guest data stays unchanged. Imported IDs use a separate namespace. Repeating the same import skips identical entries; conflicting check-ins on the same date require review. Preferences are kept from your account."
                  : "Gastdaten bleiben unverändert. Importierte IDs erhalten einen eigenen Namensraum. Wiederholte identische Übernahmen werden übersprungen; abweichende Check-ins am selben Datum müssen geprüft werden. Kontoeinstellungen bleiben erhalten."}
              </p>
              <button
                className="btn"
                onClick={() => {
                  exportState(guest);
                  setBackedUp(true);
                }}
              >
                {en ? "Export guest backup" : "Gastbackup exportieren"}
              </button>
              <button
                className="btn primary"
                disabled={!backedUp || saving || readonly}
                onClick={() => {
                  void importGuest();
                  setGuest(null);
                }}
              >
                {en
                  ? "Confirm import to this account"
                  : "Übernahme in dieses Konto bestätigen"}
              </button>
              <button className="btn" onClick={() => setGuest(null)}>
                {en ? "Cancel" : "Abbrechen"}
              </button>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
