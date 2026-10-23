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
        "Think about your goals, equipment and available time. Account-based preferences will follow once Supabase is configured.",
        "Create an exercise with a name, movement pattern and measurements.",
        "Choose your exercises and targets, then schedule a session if you like.",
        "This version saves locally. Export regular JSON backups. Cloud accounts and sync are not connected yet; a Vercel login is not an Eúzēn account.",
      ]
    : [
        "Es werden keine Beispielworkouts oder Übungen automatisch hinzugefügt. Du entscheidest, womit du beginnst.",
        "Überlege dir Ziele, Equipment und verfügbare Zeit. Kontobezogene Einstellungen folgen nach der Supabase-Einrichtung.",
        "Lege eine Übung mit Name, Bewegungsmuster und Messgrößen an.",
        "Wähle Übungen und Vorgaben und plane anschließend optional eine Einheit.",
        "Dieser Stand speichert lokal. Exportiere regelmäßig JSON-Backups. Cloud-Konten und Sync sind noch nicht verbunden; die Vercel-Anmeldung ist kein Eúzēn-Konto.",
      ];
  const move = (n: number) =>
    update((s) => ({
      ...s,
      preferences: { ...s.preferences, onboardingStep: n },
    }));
  return (
    <section
      className="panel section-gap"
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
