# Version 0.6 · Vorbereitungsstand, noch keine Kontofreigabe

## Lokal umgesetzt

- Neue lokale Bereiche starten leer. Bestehender Schlüssel `euzen/state/main` wird unverändert gelesen; keine Löschung oder automatische Übernahme in Konten. Die alten Seed-Funktionen bleiben als Testfixtures, werden vom echten Start nicht mehr aufgerufen.
- Schema erlaubt null Übungen. Ein Workout ohne Übungen führt zu einer erklärenden Bibliotheksaktion statt eines Absturzes.
- Fünfstufige, überspringbare Einführung in Deutsch/Englisch mit gespeichertem Schritt. Alte Backups erhalten standardmäßig „Einführung abgeschlossen“, neue Bereiche beginnen bei Schritt 0. Wiederöffnung über Einstellungen (sichtbar auf Heute).
- Separate IndexedDB-API für künftige Konto-Partitionen mit atomarer Speicherung von Zustand und Outbox. Eigentümer und Generation werden validiert, rückwärts gerichtete Generationen abgelehnt. Diese API ist absichtlich noch nicht in den Anmeldeablauf integriert.

## SQL-Kandidat, NICHT ausgeführt

`supabase/migrations/202610230001_private_training.sql` enthält Profile, Bereichsgenerationen und pro Entität gespeicherte Daten; kein kompletter AppState-Cloud-Blob. RLS und Grants schränken private Datensätze auf auth.uid() ein. Änderungen erfolgen über authentifizierte RPCs mit serverseitigen Revisionen, Operationsbelegen und Zeilensperre. Reset und Upload werden pro Bereich serialisiert. Reset erhöht die Generation; alte Uploads werden abgewiesen. Profil bleibt bestehen.

Noch kein freigegebenes Datenmodell: JSON-Payloads benötigen zusätzliche fachliche Validierung und normalisierte Fremdschlüssel für verschachtelte Referenzen. Quoten, Payload-/Profil-Limits, Revisionskonflikt-UI, vollständiger RLS-Testumfang und langfristige Belegbereinigung sind offen. Die RPCs sind nicht an einen Client angeschlossen. Es gibt **keinen** jetzt bedienbaren Cloud-Reset und keine neue Löschaktion für bestehende lokale Daten.

Ein pgTAP-Testentwurf mit zwei Nutzern, Idempotenz und Generationen liegt in `supabase/tests/private_training.sql`. Er wurde mangels freigegebener Datenbank nicht ausgeführt und beweist daher noch keine reale Mandantentrennung. Vor Freigabe Tests um direkte Schreibversuche, Eigentümermanipulation, anonyme Zugriffe und konkurrierende Requests erweitern.

## Blockierende Entscheidungen / Fortsetzung

Supabase-Verbindung wurde gesucht; ein Plugin ist verfügbar, aber noch nicht installiert/verbunden bestätigt. Benötigt werden Projekt/Organisation, EU-Region, separate Testumgebung/Kostenfreigabe und später ein bestätigter E-Mail-Absender/SMTP-Konzept. Keine Secrets im Chat oder Repository. `.env.example` enthält nur Platzhalter; sie werden bisher von keiner Auth-Oberfläche konsumiert.

Nach Freigabe: offizielles Supabase-SDK, Einmalcode-Anmeldung, echte Profile und nutzerbezogene Speicherumschaltung implementieren. Initialen Cloud-Abgleich vor leerem lokalem Zustand absichern. Vorhandene unzugeordnete Daten nur nach Mengenübersicht und ausdrücklicher Zustimmung übernehmen; sonst separat sichern. Dann Outbox/Pull/Revisionskonflikte, Kontowechsel, Abmelden, Reset-Oberfläche und Zwei-Geräte-Abnahme integrieren. CSP nur für die konkrete Projektadresse erweitern.

Aktuell weiterhin **lokale App ohne Benutzerkonto oder Cloud-Sync**. Kein Supabase-Projekt angelegt, keine Migration extern ausgeführt und keine produktive Freigabe. Vorbereitungsstand nicht als vollständige Version 0.6 bezeichnen.

Automatisiert geprüft: leerer Neustart, vorhandene Persistenz/Backups, getrennte Konto-Partitionen, Outbox-Atomizität und Blockieren alter Generationen sowie bestehende Suite. Datenbank- und echte iPhone-/Android-Tests bleiben offen.
