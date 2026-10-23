# Auth · technischer Zwischenstand für 0.6

## Implementiert

`src/data/auth.ts` nutzt das gepinnte offizielle SDK 2.118.0. Die Client-Fabrik akzeptiert ausschließlich die freigegebene Testprojekt-URL und Publishable-Keys. Keine URL-Sessionübernahme, eigener Auth-Speicherschlüssel. Service für OTP-Anforderung/Prüfung, serverseitig geprüfte Nutzer-ID, Profil lesen/anlegen/ändern und lokale Abmeldung. Keine Zugriffe auf Trainingsdaten. Backend-Fehlermeldungen werden nicht an Nutzer durchgereicht.

Node >=22.12 erforderlich. Vitest auf 4.1.12 aktualisiert, nachdem npm audit Sicherheitslücken im bisherigen Testwerkzeug gemeldet hatte. Wegen eines npm-Arborist-Fehlers bei optionaler Peer-Auflösung erfolgte die Aktualisierung mit `--legacy-peer-deps`; anschließend gesamte Suite mit Node 22 geprüft. Keine erzwungene pauschale Audit-Reparatur.

## Noch nicht integriert

Update 23.10.: Die folgende ursprüngliche Beschreibung ist überholt: `Account` ist jetzt in Einstellungen eingebunden, lazy geladen und nutzt die lokale, gitignorierte Testkonfiguration. INITIAL_SESSION und Auth-Änderungen werden abonniert; Abmeldung, OTP-Eingabe und Profilformular DE/EN sind implementiert. Profilantworten sind an die Lebensdauer der jeweiligen Nutzeransicht gebunden. Der lokale Trainingsbereich bleibt ausdrücklich unzugeordnet. CSP enthält ausschließlich die konkrete Supabase-Origin. Keine Trainingsspeicherumschaltung oder Synchronisierung; diese Meilensteine sind weiterhin offen. Vercel-Umgebungsvariablen wurden nicht gesetzt, keine Veröffentlichung. Browser-End-to-End-Abnahme und echter Versand sind noch nicht erfolgt; die bestehende Vorschau zeigte beim Nachsehen noch den alten Stand. 71 Unit-/Render-Tests, Typecheck und Build erfolgreich. Render-Tests ersetzen keine Interaktionstests.

Service ist absichtlich noch nicht in App/Settings eingehängt. Daher keine sichtbare Anmeldung, keine Profilbearbeitung und keine neue Sessionrestoration in der Oberfläche. Keine lokalen Daten automatisch zugeordnet. `.env.example` wird noch nicht von einer App-Initialisierung gelesen. Kein Cloud-Sync oder Reset.

Nächste Implementierung: Auth-Controller mit geschützter asynchroner Antwortverarbeitung, Konto-Gate und getrennte Trainingsspeicher einschließlich Editorentwürfen. Vorher keine Anmeldung neben scheinbar bereits zugeordneten Gastdaten anzeigen. Profile-UI vollständig DE/EN umsetzen. Anschließend Sync und Reset gemäß VERSION-0.6-PREPARATION.md.

## E-Mail-Konfiguration: vor End-to-End-Test prüfen

Offizielle Grundlage: https://supabase.com/docs/guides/auth/auth-email-passwordless

- `signInWithOtp` versendet standardmäßig einen Magic Link. Für Codeeingabe muss die passende E-Mail-Vorlage `{{ .Token }}` enthalten (auch Registrierungspfad prüfen).
- E-Mail-Provider aktivieren und Code-Länge/Expiry mit der Oberfläche abstimmen. Service akzeptiert 6–10 Ziffern; Konfiguration nicht als bekannt voraussetzen.
- Serverlimits sind maßgeblich; 60-Sekunden-Clientsperre ist nur zusätzlicher Bedienungsschutz.
- Absender, SMTP, erlaubte Empfänger und Versandlimits im konkreten Testprojekt prüfen. Keine Zustellbarkeit an beliebige Tester versprechen. Kein kostenpflichtiger SMTP-Dienst eingerichtet.
- Konkrete Projektadresse in Vercel-CSP `connect-src` freigeben, wenn App integriert wird. Keine Wildcard und keine Tokens in URLs.
- Keine Auth-Antworten oder Profile im Service-Worker-Cache ablegen.
- Publishable-Key nur in lokaler/Vercel-Konfiguration; keine Secret-/Service-Role-Keys.

## Verifikation

Acht neue Unit-Tests mit gemocktem SDK: Konfigurationsgrenzen, offline/ungültige E-Mail, Cooldown, Doppelklick, generische Fehler, Codeprüfung, lokale Abmeldung und Profilvalidierung. Kein Ersatz für echten Versand, RLS oder Browser-End-to-End-Test.

Die zuvor ausgeführten Profil-RLS-Tests sind separat dokumentiert. Kein Nutzerkonto erstellt, keine E-Mail ausgelöst und keine neue Datenbankmigration in diesem Schritt ausgeführt.
