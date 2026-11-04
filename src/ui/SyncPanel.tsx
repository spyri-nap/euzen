import { useState } from "react";
import { getLanguage, useLanguage } from "../i18n";
import { loadState, exportState } from "../data/storage";
import type { AppState } from "../domain/model";
import { entities } from "../data/sync";
import type { SyncConflict } from "../data/sync";
export function syncLabel(status: string, saving: boolean) {
  const en = getLanguage() === "en";
  if (saving) return en ? "Saving locally…" : "Wird lokal gespeichert …";
  const labels: Record<string, [string, string]> = {
    readonly: [
      "Lesemodus · anderer Tab bearbeitet",
      "Read-only · another tab is editing",
    ],
    quota: [
      "Speichergrenze erreicht · Backup exportieren",
      "Storage limit reached · export a backup",
    ],
    validation: [
      "Änderung nicht angenommen · Daten prüfen",
      "Change rejected · review data",
    ],
    generation: [
      "Kontobestand wurde zurückgesetzt · lokales Backup exportieren",
      "Account was reset · export a local backup",
    ],
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
  state,
  recoverGeneration,
  exportRecovery,
  owner,
  status,
  saving,
  readonly,
  conflict,
  resolve,
  importGuest,
}: {
  state: AppState;
  recoverGeneration: () => Promise<boolean>;
  exportRecovery: () => Promise<void>;
  owner: string | null;
  status: string;
  saving: boolean;
  readonly: boolean;
  conflict: SyncConflict | null;
  resolve: (choice: "local" | "server") => Promise<void>;
  importGuest: () => Promise<boolean>;
}) {
  useLanguage();
  const en = getLanguage() === "en";
  const [guest, setGuest] = useState<AppState | null>(null);
  const [backedUp, setBackedUp] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflictBackup, setConflictBackup] = useState(false);
  const help: Record<string, [string, string]> = {
    pending: [
      "Deine Änderungen sind auf diesem Gerät gespeichert. Lass die App mit Internetverbindung geöffnet, bis Synchronisiert erscheint.",
      "Your changes are saved on this device. Keep the app open and connected until Synced appears.",
    ],
    offline: [
      "Du kannst lokal weiterarbeiten. Der Kontoabgleich läuft weiter, sobald die Verbindung zurück ist. Exportiere vor einem Gerätewechsel ein Backup.",
      "You can continue locally. Account sync resumes when the connection returns. Export a backup before switching devices.",
    ],
    readonly: [
      "Ein anderes Fenster bearbeitet diesen Bereich. Verwende dieses Fenster oder schließe die anderen Eúzēn-Fenster und lade neu.",
      "Another window is editing this area. Use that window, or close other Eúzēn windows and reload.",
    ],
    auth: [
      "Lokal verfügbare Daten bleiben erhalten. Melde dich erneut an, damit der Kontoabgleich fortgesetzt werden kann.",
      "Locally available data is preserved. Sign in again to resume account sync.",
    ],
    error: [
      "Der Kontoabgleich ist unterbrochen. Prüfe deine Verbindung und sichere vor dem Schließen ein Backup. Nicht bestätigte Änderungen sind möglicherweise noch nicht dauerhaft gespeichert.",
      "Account sync is interrupted. Check your connection and export a backup before closing. Unconfirmed changes may not yet be saved durably.",
    ],
  };
  const local = conflict
    ? (entities(state).find(
        (e) =>
          e.kind === conflict.operation.kind &&
          e.id === conflict.operation.entityId,
      )?.payload ?? null)
    : null;
  return (
    <section aria-label={en ? "Synchronization" : "Synchronisierung"}>
      <p role="status" aria-live="polite">
        {syncLabel(status, saving)}
      </p>
      {help[status] && <p className="hint">{help[status][en ? 1 : 0]}</p>}
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
              {JSON.stringify(local, null, 2)}
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
            onClick={() => {
              exportState(state);
              setConflictBackup(true);
            }}
          >
            {en
              ? "Export local version first"
              : "Lokale Fassung vorher exportieren"}
          </button>
          <button
            className="btn"
            disabled={readonly || saving || !conflictBackup}
            onClick={() => {
              setConflictBackup(false);
              void resolve("server");
            }}
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
      {owner && status === "generation" && (
        <div>
          <p>
            {en
              ? "Your account was reset elsewhere. Export your local version before accepting the new generation. The old local version will also be archived."
              : "Dein Konto wurde anderswo zurückgesetzt. Exportiere deinen lokalen Stand, bevor du den neuen Kontostand übernimmst. Der alte lokale Stand wird zusätzlich archiviert."}
          </p>
          <button
            className="btn"
            onClick={() => {
              exportState(state);
              setConflictBackup(true);
            }}
          >
            {en ? "Export local backup" : "Lokales Backup exportieren"}
          </button>
          <button
            className="btn"
            disabled={!conflictBackup || readonly || saving}
            onClick={async () => {
              if (!(await recoverGeneration()))
                setError(
                  en
                    ? "Recovery failed; data preserved."
                    : "Wiederherstellung fehlgeschlagen; Daten bleiben erhalten.",
                );
              setConflictBackup(false);
            }}
          >
            {en
              ? "Accept new account generation"
              : "Neuen Kontostand übernehmen"}
          </button>
        </div>
      )}
      {owner && (
        <button className="text-button" onClick={() => void exportRecovery()}>
          {en
            ? "Export latest archived recovery, if available"
            : "Letzten archivierten Stand exportieren, falls vorhanden"}
        </button>
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
                  ? "Guest data stays unchanged. Imported IDs use a separate namespace. Repeating the same import skips identical entries; conflicting check-ins on the same date require review. Preferences are kept from your account. A changed guest snapshot is imported as a new copy; two active sessions cannot be merged."
                  : "Gastdaten bleiben unverändert. Importierte IDs erhalten einen eigenen Namensraum. Wiederholte identische Übernahmen werden übersprungen; abweichende Check-ins am selben Datum müssen geprüft werden. Kontoeinstellungen bleiben erhalten. Ein geänderter Gastbestand wird als neue Kopie importiert; zwei aktive Sessions können nicht zusammengeführt werden."}
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
                disabled={!backedUp || saving || readonly || busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const success = await importGuest();
                    if (success) setGuest(null);
                    else
                      setError(
                        en
                          ? "Import not saved. Review the error and retry; guest data is unchanged."
                          : "Übernahme nicht gespeichert. Fehler prüfen und erneut versuchen; Gastdaten sind unverändert.",
                      );
                  } finally {
                    setBusy(false);
                  }
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
