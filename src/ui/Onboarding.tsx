import { getLanguage } from "../i18n";
import { type AppState } from "../domain/model";
export function Onboarding({
  state,
  update,
  onLibrary,
  onWorkout,
  onPlan,
}: {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  onLibrary: () => void;
  onWorkout: () => void;
  onPlan: () => void;
}) {
  const en = getLanguage() === "en",
    step = state.preferences.onboardingStep;
  if (step === 5) return null;
  const titles = en
    ? [
        "Your space. A fresh start.",
        "Make it your own.",
        "Start with one exercise.",
        "Build your first workout.",
        "Keep your data safe.",
      ]
    : [
        "Dein Raum. Ein neuer Anfang.",
        "Gestalte deinen Rhythmus.",
        "Beginne mit einer Übung.",
        "Gestalte dein erstes Workout.",
        "Bewahre deine Daten sicher auf.",
      ];
  const copy = en
    ? [
        "No example workouts or exercises are added automatically. You decide where to start.",
        "Start locally as a guest. Choose the exercises, equipment and duration in your workout. You can connect an account in Settings & Data when account access is enabled.",
        "Open Library, choose Create exercise and save a name, movement pattern and measurements. Then return here to build your workout.",
        "Choose your exercises and targets, then schedule a session if you like.",
        "Guest data stays on this device. With an enabled Eúzēn account, check the sync status in Settings & Data. Export regular backups. The test-access login and your Eúzēn account are separate.",
      ]
    : [
        "Es werden keine Beispielworkouts oder Übungen automatisch hinzugefügt. Du entscheidest, womit du beginnst.",
        "Starte lokal als Gast. Übungen, Equipment und Dauer wählst du in deinem Workout. Verbinde bei aktiviertem Kontozugang dein Konto unter Einstellungen & Daten.",
        "Öffne die Bibliothek, wähle Eigene Übung und speichere Name, Bewegungsmuster und Messgrößen. Kehre anschließend hierher zurück, um dein Workout zu erstellen.",
        "Wähle Übungen und Vorgaben und plane anschließend optional eine Einheit.",
        "Gastdaten bleiben auf diesem Gerät. Mit aktiviertem Eúzēn-Konto prüfst du den Sync-Status unter Einstellungen & Daten. Exportiere regelmäßig Backups. Testzugang und Eúzēn-Konto sind getrennte Anmeldungen.",
      ];
  const move = (n: number) =>
    update((s) => ({
      ...s,
      preferences: { ...s.preferences, onboardingStep: n },
    }));
  return (
    <section
      className="panel onboarding"
      aria-label={en ? "Getting started" : "Einführung"}
    >
      <p className="eyebrow">EÚZĒN · {step + 1}/5</p>
      <h2>{titles[step]}</h2>
      <p>{copy[step]}</p>
      <div className="button-row">
        {step === 2 && (
          <button className="btn primary" onClick={onLibrary}>
            {en ? "Create first exercise" : "Erste Übung anlegen"}
          </button>
        )}
        {step === 3 && (
          <>
            <button className="btn primary" onClick={onWorkout}>
              {en ? "Create workout" : "Workout erstellen"}
            </button>
            <button className="btn" onClick={onPlan}>
              {en ? "Plan your week" : "Woche planen"}
            </button>
          </>
        )}
        {step > 0 && (
          <button className="btn" onClick={() => move(step - 1)}>
            {en ? "Back" : "Zurück"}
          </button>
        )}
        <button className="btn" onClick={() => move(step + 1)}>
          {step === 4
            ? en
              ? "Finish"
              : "Abschließen"
            : en
              ? "Next"
              : "Weiter"}
        </button>
        <button className="btn" onClick={() => move(5)}>
          {en ? "Skip introduction" : "Einführung überspringen"}
        </button>
      </div>
    </section>
  );
}
