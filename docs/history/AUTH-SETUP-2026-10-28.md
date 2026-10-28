> Neuester Stand: Trainings-Sync-Migration im Testprojekt angewendet, Transport und experimentelle Store-Anbindung vorhanden. Standardmäßig deaktiviert; keine bedienbare 0.6-Freigabe. Verbindliche Details und offene Punkte: [SYNC-ARCHITECTURE.md](SYNC-ARCHITECTURE.md).

> Stand 28.10.2026: OTP-Anmeldung vom Nutzer bestätigt; IONOS-SMTP und Vorlagen gespeichert. Kontosync ist noch nicht bedienbar. Neue, getestete Sync-Protokoll-/Outbox-Basis siehe [SYNC-ARCHITECTURE.md](SYNC-ARCHITECTURE.md). Ältere Zwischenstände unten sind historisch; insbesondere offene SMTP-/SDK-Integration ist überholt.

# Auth · technischer Zwischenstand für 0.6

## Implementiert

`src/data/auth.ts` nutzt das gepinnte offizielle SDK 2.118.0. Die Client-Fabrik akzeptiert ausschließlich die freigegebene Testprojekt-URL und Publishable-Keys. Keine URL-Sessionübernahme, eigener Auth-Speicherschlüssel. Service für OTP-Anforderung/Prüfung, serverseitig geprüfte Nutzer-ID, Profil lesen/anlegen/ändern und lokale Abmeldung. Keine Zugriffe auf Trainingsdaten. Backend-Fehlermeldungen werden nicht an Nutzer durchgereicht.

Node >=22.12 erforderlich. Vitest auf 4.1.12 aktualisiert, nachdem npm audit Sicherheitslücken im bisherigen Testwerkzeug gemeldet hatte. Wegen eines npm-Arborist-Fehlers bei optionaler Peer-Auflösung erfolgte die Aktualisierung mit `--legacy-peer-deps`; anschließend gesamte Suite mit Node 22 geprüft. Keine erzwungene pauschale Audit-Reparatur.

## Noch nicht integriert

Update 23.10.: Die folgende ursprüngliche Beschreibung ist überholt: `Account` ist jetzt in Einstellungen eingebunden, lazy geladen und nutzt die lokale, gitignorierte Testkonfiguration. INITIAL_SESSION und Auth-Änderungen werden abonniert; Abmeldung, OTP-Eingabe und Profilformular DE/EN sind implementiert. Profilantworten sind an die Lebensdauer der jeweiligen Nutzeransicht gebunden. Der lokale Trainingsbereich bleibt ausdrücklich unzugeordnet. CSP enthält ausschließlich die konkrete Supabase-Origin. Keine Trainingsspeicherumschaltung oder Synchronisierung; diese Meilensteine sind weiterhin offen. Vercel-Umgebungsvariablen wurden nicht gesetzt, keine Veröffentlichung. Browser-End-to-End-Abnahme und echter Versand sind noch nicht erfolgt; die bestehende Vorschau zeigte beim Nachsehen noch den alten Stand. 71 Unit-/Render-Tests, Typecheck und Build erfolgreich. Render-Tests ersetzen keine Interaktionstests.

## Interaktive Prüfung und konkreter Versandblocker

Am 23.10. im Browser geprüft: bestehende 127.0.0.1-Vorschau lädt die aktuelle Kontoansicht in Einstellungen. Server PID 74027 hat das erwartete Repository als Arbeitsverzeichnis; HTTP liefert Vite-Dev-HTML. Die sichtbare Versionsnummer 0.5 ist kein Nachweis für alten Code. Separater Ursprung `localhost:5173` startet leer (0 Übungen/Workouts/Sessions), zeigt die Einführung und die Kontoansicht. Ungültige E-Mail wird durch Browservalidierung vor Versand blockiert; Sprachwechsel zeigt die englische Kontoansicht. Dabei keine echten E-Mails aus der isolierten Ansicht versendet. Screenshot: outputs/account-english-check.png im übergeordneten Workspace.

Öffentliche `/auth/v1/settings` antworten HTTP 200: E-Mail aktiv, Registrierung erlaubt, automatische Bestätigung deaktiviert. Keine Auskunft über SMTP oder Vorlagen über diesen Endpunkt.

Nutzer meldet nach eigenem Versandversuch: Supabase-Mail zugestellt, aber Mail Confirmation statt Code. Zustellung ist damit nutzerbestätigt, OTP-Verifikation bleibt ungeprüft. Wahrscheinlicher Konfigurationsbruch: Bestätigungs-/OTP-Vorlage enthält noch keinen sichtbaren Token. Dashboard unter https://supabase.com/dashboard/project/yvxzcawjtyqcljuoyfeg/auth/templates verlangt Anmeldung. Connector bietet keinen Auth-Konfigurationszugriff. Keine Vorlage geändert und E-Mail-Bestätigung NICHT deaktiviert.

Nach Dashboard-Anmeldung Vorlagen **Confirm sign up** und **Magic link or OTP** prüfen. Beide müssen für diesen Ablauf einen sichtbaren `{{ .Token }}` statt ausschließlich `{{ .ConfirmationURL }}` anbieten. Geeigneter minimaler Inhalt:

```html
<h2>Eúzēn · Dein Anmeldecode / Your sign-in code</h2>
<p>Gib diesen Code in Eúzēn ein. / Enter this code in Eúzēn:</p>
<p style="font-size:28px;letter-spacing:4px">{{ .Token }}</p>
<p>Teile den Code nicht. / Do not share this code.</p>
<p>
  Nicht angefordert? Ignoriere diese Nachricht. / If you did not request this,
  ignore this message.
</p>
```

Dann nach Cooldown neuen Code anfordern; ausschließlich neueste Mail nutzen und Code direkt in der App eingeben. Kein Code im Chat, keine Wiederverwendung alter Tokens. Danach Profil anlegen, neu laden und abmelden prüfen. Für vollständigen Pfad fehlen weiterhin Trainingsspeicherumschaltung, Sync/Reset und Geräteabnahme.

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
