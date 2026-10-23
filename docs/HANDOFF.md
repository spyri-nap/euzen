# Übergabe · Arbeit pausiert am 22.10.2026

Späterer Ausbau 23.10.: Gespeicherte Sprachwahl Deutsch/Englisch in Einstellungen, Locale-Formate und erster UI-Katalog implementiert. Siehe LANGUAGES.md für Tests und noch deutsche dynamische Texte. Vorhandene Inhalte bleiben unverändert. Hosting noch nicht geklärt.

Fortsetzung 23.10.2026: Version 0.5 als lokale PWA-Testbasis implementiert. Siehe VERSION-0.5.md für Update-Strategie, Installationshilfe und offene Abnahme. Hosting-Ziel/Zugangsschutz noch zu klären. Keine Veröffentlichung erfolgt. P1 und echte Gerätetests nicht abgeschlossen.

## Gesicherter Stand

- Eúzēn Version 0.4: lokale React-/TypeScript-/Vite-App für funktionelles Training und Longevity.
- Branch: `feat/euzen-foundation`; bestehender Entwurfs-PR: https://github.com/spyri-nap/euzen/pull/1. Nicht gemergt oder produktiv veröffentlicht.
- Enthalten: Übungsbibliothek, Workout-Baukasten, Wochenplanung, Trainingsplayer, lokale Speicherung/Backups, Fortschritt und Space.
- Neueste Funktionen: geführte Zeitblöcke, Vorbereitung und Satzvorgaben (0.3); Zeitraumvergleiche, Übungsverläufe und regelbasierte Wochenrückblicke (0.4). Details in den Versionsdokumenten.
- Letzte UI-Korrektur: Logo in der Seitenleiste zentriert, kompakte Variante auf 24 px verkleinert.
- Verifikation: 49 Tests erfolgreich, TypeScript/Produktionsbuild und Formatprüfung erfolgreich für 0.4; nach der Logo-Korrektur Produktionsbuild und visuelle Browserprüfung erfolgreich.

## Nächste Session

1. Git-Stand und gegebenenfalls neue Nutzeränderungen prüfen; keine Dateien zurücksetzen.
2. `npm ci` bei fehlenden Abhängigkeiten, danach `npm run dev` (Node 20.19+ oder 22.12+). Bisherige Nutzervorschau: http://127.0.0.1:5173/.
3. Vor weiterem Ausbau das nächste Ziel mit dem Nutzer aufnehmen. Kein weiteres Feature ist verbindlich beauftragt.
4. Änderungen mit `npm test`, `npm run build` und `npm run format:check` prüfen. Browser-QA nach Möglichkeit auf separatem Ursprung/Port durchführen, ohne Nutzerprotokolle zu verändern.

## Grenzen und Datensicherung

Trainingsdaten und Check-ins liegen ausschließlich in IndexedDB des verwendeten Browserprofils und Ursprungs. Sie sind **nicht** Teil des Git-Repositories. Für eine unabhängige Sicherung in „Einstellungen & Daten“ ein JSON-Backup exportieren; Browserdaten nicht löschen. Es ist keine Cloud-Synchronisierung aktiv.

KI, News und Health-Connectors sind noch nicht angeschlossen. Auswertungen sind lokal und regelbasiert, keine medizinische Bewertung. Physische Smartphone-Tests und ein vollständiger Accessibility-Audit stehen noch aus.

Standardbrowser des Nutzers ist Arc, nicht Chrome. Bestehenden Branch und PR weiterverwenden; keine automatische Zusammenführung oder Veröffentlichung.
