import { Modal } from "./common";
import { getLanguage } from "../i18n";

type LegalPage = "privacy" | "imprint";

const copy = {
  de: {
    privacy: {
      title: "Datenschutzinformationen",
      sections: [
        [
          "Verantwortlicher",
          "Spyridon Panagopoulos · Rauental 10 · 42289 Wuppertal · info@nap-studios.de · +49 176 97529412",
        ],
        [
          "Geschlossener Test",
          "Eúzēn verarbeitet Angaben für den Betrieb des geschlossenen Tests, Fehleranalyse und Verbesserung. Die Teilnahme und Feedback sind freiwillig. Die konkrete Rechtsgrundlage und Speicherdauer stehen zur anwaltlichen Prüfung aus.",
        ],
        [
          "Lokale Daten, Konto und Backups",
          "Workouts, Pläne, Sessions, Notizen und Einstellungen werden lokal im Browser gespeichert. Bei freigegebenem Konto-Sync können Kontodaten und Trainingsdaten synchronisiert werden. Backups liegen in deiner eigenen Datei. Browserdaten und Backups können getrennt gelöscht werden.",
        ],
        [
          "Gesundheitsdaten",
          "Bitte gib keine Diagnosen, Verletzungen, Medikamente, Schmerzen, Therapien oder sonstigen Gesundheitsinformationen ein. Eine Verarbeitung besonderer Kategorien nach Art. 9 DSGVO ist für diese Testphase nicht freigegeben.",
        ],
        [
          "Deine Rechte",
          "Du kannst Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch verlangen sowie eine Einwilligung widerrufen. Datenschutz- und Löschanfragen: info@nap-studios.de. Es besteht ein Beschwerderecht bei einer zuständigen Aufsichtsbehörde.",
        ],
        [
          "Status",
          "Technisch vorbereitet für die rechtliche Prüfung. Eine anwaltliche Prüfung und Freigabe stehen noch aus. Stand: 3. November 2026.",
        ],
      ],
    },
    privacyEn: {
      title: "Privacy information",
      sections: [
        [
          "Controller",
          "Spyridon Panagopoulos · Rauental 10 · 42289 Wuppertal · info@nap-studios.de · +49 176 97529412",
        ],
        [
          "Closed test",
          "Eúzēn processes information to operate the closed test, analyse errors and improve the app. Participation and feedback are voluntary. The final legal basis and retention period remain subject to legal review.",
        ],
        [
          "Local data, account and backups",
          "Workouts, plans, sessions, notes and settings are stored in the browser. If account sync is enabled, account and training data may synchronize. Backups remain in files chosen by you.",
        ],
        [
          "Health data",
          "Do not enter diagnoses, injuries, medication, pain, therapies or other health information. Processing special categories under Article 9 GDPR is not approved for this test phase.",
        ],
        [
          "Your rights",
          "You may request access, rectification, erasure, restriction, portability and object, and withdraw consent. Contact: info@nap-studios.de. You may also complain to a competent supervisory authority.",
        ],
        [
          "Status",
          "Technically prepared for legal review. Legal counsel review and approval are still pending. Dated 3 November 2026.",
        ],
      ],
    },
  },
} as const;

export function LegalPages({
  page,
  onClose,
  onConfirm,
}: {
  page: LegalPage;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const language = getLanguage() === "en" ? "en" : "de";
  const content =
    page === "imprint"
      ? {
          title: language === "en" ? "Imprint" : "Impressum",
          sections:
            language === "en"
              ? ([
                  [
                    "Provider",
                    "Spyridon Panagopoulos · Rauental 10 · 42289 Wuppertal · Germany",
                  ],
                  ["Contact", "info@nap-studios.de · +49 176 97529412"],
                  [
                    "Note",
                    "Eúzēn is initially a personal project by Spyridon Panagopoulos.",
                  ],
                ] as const)
              : ([
                  [
                    "Anbieter",
                    "Spyridon Panagopoulos · Rauental 10 · 42289 Wuppertal · Deutschland",
                  ],
                  ["Kontakt", "info@nap-studios.de · +49 176 97529412"],
                  [
                    "Hinweis",
                    "Eúzēn ist zunächst ein persönliches Projekt von Spyridon Panagopoulos.",
                  ],
                ] as const),
        }
      : language === "en"
        ? copy.de.privacyEn
        : copy.de.privacy;
  return (
    <Modal title={content.title} onClose={onClose} wide>
      <article className="legal-content" lang={language}>
        {content.sections.map(([heading, text]) => (
          <section key={heading}>
            <h3>{heading}</h3>
            <p>{text}</p>
          </section>
        ))}
        <p className="hint">
          <a
            href={page === "privacy" ? "/datenschutz.html" : "/impressum.html"}
            target="_blank"
            rel="noreferrer"
          >
            {language === "en"
              ? "Open the standalone page"
              : "Eigenständige Seite öffnen"}
          </a>
        </p>
      </article>
      {onConfirm && (
        <button type="button" className="btn primary" onClick={onConfirm}>
          {language === "en"
            ? "Privacy information understood"
            : "Datenschutz verstanden"}
        </button>
      )}
    </Modal>
  );
}
