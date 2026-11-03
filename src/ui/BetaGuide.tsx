import { useState } from "react";

const guides = {
  de: {
    title: "Beta-Leitfaden · Test starten",
    intro:
      "Willkommen bei Eúzēn, deiner App für funktionales Training und langfristige Bewegung. Geschlossene Testversion: Funktionen können sich ändern.",
    steps: [
      "Wähle deine Sprache. Die App-Oberfläche unterstützt Deutsch und Englisch; dieser Leitfaden zusätzlich Griechisch.",
      "Beginne mit einem leeren Gastbereich. Inhalte werden lokal in diesem Browser gespeichert. Browserbereinigung kann sie entfernen; exportiere regelmäßig ein JSON-Backup unter Einstellungen & Daten.",
      "Melde dich unter Einstellungen & Daten mit deiner E-Mail an. Gib den erhaltenen Code ausschließlich in Eúzēn ein. Der Vercel-Zugang ist davon getrennt und muss für dich freigegeben sein.",
      "Im angemeldeten Konto werden Trainingsdaten bei verfügbarer Verbindung synchronisiert. Gastdaten bleiben getrennt. Für eine Übernahme öffne die Gastübernahme, prüfe Zielkonto und Vorschau, exportiere ein Backup und bestätige ausdrücklich.",
      "Dein Test (15–20 Minuten): Lege zwei Übungen an und erstelle daraus ein Workout. Wähle passende Wiederholungen oder einen Timer. Starte eine kurze Session, schließe sie ab und speichere eine Notiz.",
      "Öffne die App erneut und prüfe den Synchronisierungsstatus. Optional: Nach bestätigter Offline-Vorbereitung eine kleine Notiz offline ändern, App erneut öffnen, Verbindung herstellen und erfolgreichen Abgleich prüfen.",
      "Optional: iPhone in Safari → Teilen → Zum Home-Bildschirm. Android in Chrome → Browsermenü → App installieren. Melde dich auf einem zweiten Gerät mit demselben Konto an und prüfe deine Daten. Android-Gerätetests stehen noch aus.",
      "Bei Konflikten erst ein Backup exportieren, dann lokale und Serverfassung vergleichen und bewusst auswählen. Backups enthalten sensible Trainingsdaten; nicht an Feedback anhängen.",
      "Zum Kontowechsel abmelden, den getrennten Gastbereich prüfen und mit dem anderen Konto anmelden. Noch nicht synchronisierte Änderungen vorher sichern.",
      "Updates kommen über Vercel. Vor wichtigen Updates Backup exportieren; laufendes Training beenden, alle alten App-Fenster schließen und erneut öffnen. Hintergrundton und Ausführung bei Displaysperre sind nicht garantiert.",
    ],
    feedback: "Feedback vorbereiten",
    labels: [
      "Gerät",
      "Betriebssystem",
      "Browser",
      "Testaufgabe",
      "Erwartung",
      "Ergebnis / Fehler",
      "Schritte zur Wiederholung",
      "Kontakt (freiwillig)",
    ],
    warning:
      "Keine Codes, Tokens, privaten Trainingsinhalte oder Backups eingeben. Der Text wird erst nach deiner Prüfung über dein E-Mail-Programm versendet.",
    send: "E-Mail-Entwurf öffnen",
    priority: "Priorität",
    levels: [
      "Blocker: Zugang, Datenverlust, Kontovermischung",
      "Kritisch: Workout oder Sync verhindert",
      "Normal: umständlich oder unverständlich",
      "Kosmetisch: Darstellung oder Übersetzung",
    ],
  },
  en: {
    title: "Beta guide · Start testing",
    intro:
      "Welcome to Eúzēn, your app for functional training and lifelong movement. This is a closed test version; features may change.",
    steps: [
      "Choose your language. The app interface supports German and English; this guide also supports Greek.",
      "Start with an empty guest space. Content is stored locally in this browser. Clearing browser storage can remove it; regularly export a JSON backup in Settings & Data.",
      "Sign in with your email in Settings & Data. Enter the emailed code only in Eúzēn. Vercel access is separate and must be granted to you.",
      "Training data syncs in your signed-in account when connected. Guest data stays separate. To import it, open guest import, review the target account and preview, export a backup and explicitly confirm.",
      "Your test (15–20 minutes): Add two exercises and create a workout using them. Choose repetitions or a suitable timer. Start a short session, finish it and save a note.",
      "Reopen the app and check sync status. Optional: Once offline preparation is confirmed, edit a small note offline, reopen the app, reconnect and verify successful sync.",
      "Optional: On iPhone, use Safari → Share → Add to Home Screen. On Android, use Chrome → browser menu → Install app. Sign into the same account on a second device and check your data. Physical Android testing is pending.",
      "For conflicts, export a backup first, compare local and server versions and choose deliberately. Backups contain sensitive training data; never attach them to feedback.",
      "To switch accounts, sign out, check the separate guest space and sign into the other account. Back up any changes that have not synced first.",
      "Updates arrive through Vercel. Back up before important updates; finish training, close all old app windows and reopen. Background audio and execution while the screen is locked are not guaranteed.",
    ],
    feedback: "Prepare feedback",
    labels: [
      "Device",
      "Operating system",
      "Browser",
      "Test task",
      "Expected result",
      "Actual result / issue",
      "Steps to reproduce",
      "Contact (optional)",
    ],
    warning:
      "Do not include codes, tokens, private training content or backups. You review and send the text in your email app.",
    send: "Open email draft",
    priority: "Priority",
    levels: [
      "Blocker: access, data loss, mixed accounts",
      "Critical: workout or sync blocked",
      "Normal: awkward or unclear",
      "Cosmetic: appearance or translation",
    ],
  },
  el: {
    title: "Οδηγός δοκιμής · Ξεκινήστε",
    intro:
      "Καλώς ήρθατε στο Eúzēn, την εφαρμογή λειτουργικής προπόνησης και δια βίου κίνησης. Πρόκειται για κλειστή δοκιμαστική έκδοση· οι λειτουργίες μπορεί να αλλάξουν.",
    steps: [
      "Επιλέξτε γλώσσα. Το περιβάλλον της εφαρμογής υποστηρίζει γερμανικά και αγγλικά. Ο οδηγός διατίθεται και στα ελληνικά.",
      "Ξεκινήστε με έναν κενό χώρο επισκέπτη. Τα δεδομένα αποθηκεύονται τοπικά σε αυτό το πρόγραμμα περιήγησης. Η εκκαθάρισή του μπορεί να τα διαγράψει· εξάγετε τακτικά αντίγραφο JSON από τις ρυθμίσεις δεδομένων.",
      "Συνδεθείτε από τις ρυθμίσεις με το email σας. Πληκτρολογήστε τον κωδικό μόνο στο Eúzēn. Η πρόσβαση μέσω Vercel είναι ξεχωριστή και πρέπει να σας έχει παραχωρηθεί.",
      "Με συνδεδεμένο λογαριασμό και διαθέσιμη σύνδεση, τα δεδομένα προπόνησης συγχρονίζονται. Τα δεδομένα επισκέπτη παραμένουν χωριστά. Για εισαγωγή, ελέγξτε τον λογαριασμό προορισμού και την προεπισκόπηση, εξάγετε αντίγραφο και επιβεβαιώστε ρητά.",
      "Η δοκιμή σας (15–20 λεπτά): Προσθέστε δύο ασκήσεις και δημιουργήστε μία προπόνηση. Επιλέξτε επαναλήψεις ή κατάλληλο χρονόμετρο. Ξεκινήστε μια σύντομη συνεδρία, ολοκληρώστε την και αποθηκεύστε μια σημείωση.",
      "Ανοίξτε ξανά την εφαρμογή και ελέγξτε τον συγχρονισμό. Προαιρετικά, αφού επιβεβαιωθεί η προετοιμασία για χρήση εκτός σύνδεσης, αλλάξτε μια μικρή σημείωση χωρίς σύνδεση, ανοίξτε ξανά την εφαρμογή, επανασυνδεθείτε και ελέγξτε τον συγχρονισμό.",
      "Προαιρετικά: iPhone, Safari → Κοινή χρήση → Προσθήκη στην οθόνη αφετηρίας. Android, Chrome → μενού → Εγκατάσταση εφαρμογής. Συνδεθείτε στον ίδιο λογαριασμό σε δεύτερη συσκευή και ελέγξτε τα δεδομένα. Η δοκιμή σε πραγματική συσκευή Android εκκρεμεί.",
      "Σε σύγκρουση δεδομένων, εξάγετε πρώτα αντίγραφο, συγκρίνετε την τοπική έκδοση με εκείνη του διακομιστή και επιλέξτε προσεκτικά. Τα αντίγραφα περιέχουν ευαίσθητα δεδομένα· μην τα επισυνάπτετε στα σχόλιά σας.",
      "Για αλλαγή λογαριασμού, αποσυνδεθείτε, ελέγξτε τον χωριστό χώρο επισκέπτη και συνδεθείτε στον άλλο λογαριασμό. Αποθηκεύστε πρώτα αντίγραφο των αλλαγών που δεν έχουν συγχρονιστεί.",
      "Οι ενημερώσεις παρέχονται μέσω Vercel. Πριν από σημαντική ενημέρωση εξάγετε αντίγραφο, ολοκληρώστε την προπόνηση, κλείστε όλα τα παλιά παράθυρα και ανοίξτε ξανά. Ο ήχος και η εκτέλεση στο παρασκήνιο με κλειδωμένη οθόνη δεν είναι εγγυημένα.",
    ],
    feedback: "Προετοιμασία σχολίων",
    labels: [
      "Συσκευή",
      "Λειτουργικό σύστημα",
      "Πρόγραμμα περιήγησης",
      "Εργασία δοκιμής",
      "Αναμενόμενο αποτέλεσμα",
      "Αποτέλεσμα / πρόβλημα",
      "Βήματα αναπαραγωγής",
      "Επικοινωνία (προαιρετική)",
    ],
    warning:
      "Μην εισάγετε κωδικούς, tokens, προσωπικό περιεχόμενο προπόνησης ή αντίγραφα. Ελέγχετε και στέλνετε το κείμενο από την εφαρμογή email σας.",
    send: "Άνοιγμα προσχεδίου email",
    priority: "Προτεραιότητα",
    levels: [
      "Αποκλεισμός: πρόσβαση, απώλεια ή ανάμειξη δεδομένων",
      "Κρίσιμο: αδυναμία προπόνησης ή συγχρονισμού",
      "Κανονικό: δύσχρηστο ή ασαφές",
      "Εμφάνιση ή μετάφραση",
    ],
  },
};
export function BetaGuide() {
  const [language, setLanguage] = useState<keyof typeof guides>(() => {
    try {
      const saved = localStorage.getItem("euzen-beta-language");
      return saved === "en" || saved === "el" ? saved : "de";
    } catch {
      return "de";
    }
  });
  const [values, setValues] = useState<Record<number, string>>({});
  const [priority, setPriority] = useState(0);
  const copy = guides[language];
  return (
    <details className="panel" style={{ overflowWrap: "anywhere" }}>
      <summary>{copy.title}</summary>
      <section lang={language}>
        <label>
          Deutsch / English / Ελληνικά{" "}
          <select
            value={language}
            onChange={(e) => {
              const next = e.target.value as keyof typeof guides;
              setLanguage(next);
              try {
                localStorage.setItem("euzen-beta-language", next);
              } catch {
                /* readable without storage */
              }
            }}
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="el">Ελληνικά</option>
          </select>
        </label>
        <p>{copy.intro}</p>
        <ol>
          {copy.steps.map((step, index) => (
            <li key={index}>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <h3>{copy.feedback}</h3>
        <p>{copy.warning}</p>
        {copy.labels.map((label, index) => (
          <label key={index}>
            {label}
            <textarea
              maxLength={1000}
              value={values[index] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [index]: e.target.value }))
              }
            />
          </label>
        ))}
        <label>
          {copy.priority}
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            {copy.levels.map((level, index) => (
              <option key={index} value={index}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <a
          className="btn"
          href={`mailto:info@nap-studios.de?subject=${encodeURIComponent("Eúzēn Beta Feedback")}&body=${encodeURIComponent(`Language: ${language}\n${copy.levels[priority]}\n` + copy.labels.map((label, index) => `${label}: ${values[index] ?? ""}`).join("\n"))}`}
        >
          {copy.send}
        </a>
        <p>
          <a href="/datenschutz.html">
            Datenschutz / Privacy / Προσωπικά δεδομένα
          </a>{" "}
          · <a href="/impressum.html">Impressum / Provider / Πάροχος</a> ·{" "}
          <a href="mailto:info@nap-studios.de">Support</a>
        </p>
      </section>
    </details>
  );
}
