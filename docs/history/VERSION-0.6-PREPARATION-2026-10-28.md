> Neuester Stand: Trainings-Sync-Migration im Testprojekt angewendet, Transport und experimentelle Store-Anbindung vorhanden. Standardmäßig deaktiviert; keine bedienbare 0.6-Freigabe. Verbindliche Details und offene Punkte: [SYNC-ARCHITECTURE.md](SYNC-ARCHITECTURE.md).

> Stand 28.10.2026: OTP-Anmeldung vom Nutzer bestätigt; IONOS-SMTP und Vorlagen gespeichert. Kontosync ist noch nicht bedienbar. Neue, getestete Sync-Protokoll-/Outbox-Basis siehe [SYNC-ARCHITECTURE.md](SYNC-ARCHITECTURE.md). Ältere Zwischenstände unten sind historisch; insbesondere offene SMTP-/SDK-Integration ist überholt.

# Version 0.6 · Vorbereitungsstand, noch keine Kontofreigabe

## Lokal umgesetzt

- Neue lokale Bereiche starten leer. Bestehender Schlüssel `euzen/state/main` wird unverändert gelesen; keine Löschung oder automatische Übernahme in Konten. Die alten Seed-Funktionen bleiben als Testfixtures, werden vom echten Start nicht mehr aufgerufen.
- Schema erlaubt null Übungen. Ein Workout ohne Übungen führt zu einer erklärenden Bibliotheksaktion statt eines Absturzes.
- Fünfstufige, überspringbare Einführung in Deutsch/Englisch mit gespeichertem Schritt. Alte Backups erhalten standardmäßig „Einführung abgeschlossen“, neue Bereiche beginnen bei Schritt 0. Wiederöffnung über Einstellungen (sichtbar auf Heute).
- Separate IndexedDB-API für künftige Konto-Partitionen mit atomarer Speicherung von Zustand und Outbox. Eigentümer und Generation werden validiert, rückwärts gerichtete Generationen abgelehnt. Diese API ist absichtlich noch nicht in den Anmeldeablauf integriert.

## Freigegebene Testdatenbank · 23.10.2026

Der Nutzer hat das vorhandene Projekt `yvxzcawjtyqcljuoyfeg` (spyri-nap's Project, spyri-nap's Org, eu-west-1/Irland) ausdrücklich als Eúzēn-Testprojekt freigegeben. Status bei Prüfung: ACTIVE_HEALTHY; vorher keine öffentlichen Tabellen oder Migrationen. Keine neue kostenpflichtige Ressource und keine Produktionsfreigabe.

Migration `20261023110037_account_profiles.sql` wurde per Supabase-Migrationstool als `account_profiles` erfolgreich ausgeführt. Nur Profiltabelle, keine Demo-Daten oder automatischen Profile. Explizite Eigentümer-Policies für Lesen/Anlegen/Bearbeiten; kein anonymes Lesen, kein Client-DELETE, kein UPDATE der Nutzer-ID. Längen-/Mengenlimits für Profilfelder.

`supabase/tests/account_profiles.sql` wurde gegen die Testdatenbank erfolgreich ausgeführt: eigenes Profil lesen/ändern, zwei Nutzer voneinander isoliert, fremdes Anlegen/Ändern und Eigentümerwechsel blockiert, anonyme Zugriffe blockiert, ungültige Sprache blockiert. Transaktion wurde zurückgerollt, Testidentitäten bleiben nicht bestehen. Supabase Security Advisor anschließend ohne Hinweise. Dies prüft Datenbankrollen, noch keinen echten OTP-/Browserablauf.

## Workout-Sync-Entwurf, NICHT ausgeführt

`supabase/drafts/private_training.sql` enthält den alten Designentwurf für Profile, Bereichsgenerationen und pro Entität gespeicherte Daten; kein kompletter AppState-Cloud-Blob. Bewusst aus dem ausführbaren Migrationsordner entfernt: enthält inzwischen eine überholte Profiltabelle und noch nicht gehärtete RPCs. Nicht anwenden. Die entworfenen Reset-/Upload-Operationen serialisieren pro Bereich; Generationswechsel sollen alte Uploads abweisen.

Noch kein freigegebenes Datenmodell: JSON-Payloads benötigen zusätzliche fachliche Validierung und normalisierte Fremdschlüssel für verschachtelte Referenzen. Quoten, Payload-/Profil-Limits, Revisionskonflikt-UI, vollständiger RLS-Testumfang und langfristige Belegbereinigung sind offen. Die RPCs sind nicht an einen Client angeschlossen. Es gibt **keinen** jetzt bedienbaren Cloud-Reset und keine neue Löschaktion für bestehende lokale Daten.

Ein pgTAP-Testentwurf für den noch nicht angewendeten Workout-Sync mit zwei Nutzern, Idempotenz und Generationen liegt in `supabase/tests/private_training.sql`. Dieser Entwurf wurde nicht ausgeführt und beweist keine Isolation von Trainingsdaten. Vor Freigabe Tests um direkte Schreibversuche, Eigentümermanipulation, anonyme Zugriffe und konkurrierende Requests erweitern. Die separat ausgeführten Profiltests sind oben dokumentiert.

## Blockierende Entscheidungen / Fortsetzung

Supabase-Plugin ist verbunden, Testprojekt bestätigt und Profilbasis geprüft. Weiter offen: offizielles SDK mit kompatibler Node-Laufzeit, OTP-E-Mail-Vorlage und Absender/SMTP-Konzept. Keine Secrets im Chat oder Repository. `.env.example` enthält nur Platzhalter; sie werden bisher von keiner Auth-Oberfläche konsumiert.

Nach Freigabe: offizielles Supabase-SDK, Einmalcode-Anmeldung, echte Profile und nutzerbezogene Speicherumschaltung implementieren. Initialen Cloud-Abgleich vor leerem lokalem Zustand absichern. Vorhandene unzugeordnete Daten nur nach Mengenübersicht und ausdrücklicher Zustimmung übernehmen; sonst separat sichern. Dann Outbox/Pull/Revisionskonflikte, Kontowechsel, Abmelden, Reset-Oberfläche und Zwei-Geräte-Abnahme integrieren. CSP nur für die konkrete Projektadresse erweitern.

Aktuell weiterhin **lokale App ohne bedienbares Benutzerkonto oder Cloud-Sync**, mit extern geprüfter Profilbasis im freigegebenen Testprojekt. Kein neues Projekt angelegt und keine produktive Freigabe. Vorbereitungsstand nicht als vollständige Version 0.6 bezeichnen.

Automatisiert geprüft: leerer Neustart, vorhandene Persistenz/Backups, getrennte Konto-Partitionen, Outbox-Atomizität und Blockieren alter Generationen sowie bestehende Suite. Datenbank- und echte iPhone-/Android-Tests bleiben offen.
