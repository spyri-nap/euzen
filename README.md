# Eúzēn 0.6

Geschlossene lokale Web-Testversion für eigenes funktionelles Training: leere neue Bereiche, Übungen, Workouts, Wochenplanung, Trainingsplayer und Fortschritt. Deutsch und Englisch. Persönliche Konten mit OTP-Anmeldung und entitätsbasierter Supabase-Synchronisierung, Offline-Bearbeitung, Konfliktauflösung und freiwilliger Gastübernahme.

## Testversion starten

Node **>=22.12** verwenden. Abhängigkeiten sind bereits installiert; bei einem frischen Checkout zuerst `npm ci`. Die gitignorierte `.env.local` enthält die öffentliche Testprojekt-Konfiguration; `.env.example` dokumentiert die Namen. Keine Secret-/Service-Role-Schlüssel im Browser verwenden.

```sh
npm run build:test
npm run preview:test
```

[Lokale Testversion](http://127.0.0.1:5186/) · [unabhängiger zweiter lokaler Speicher](http://localhost:5186/). Beide Adressen greifen nach Anmeldung auf dasselbe Konto zu; ihre Gastbereiche bleiben getrennt. Bereits gestarteten Server weiterverwenden; keinen fremden Prozess beenden.

Der Testbuild liegt separat in `dist-test/` und aktiviert Sync ausschließlich für das freigegebene Supabase-Testprojekt. `npm run build` und `npm run dev` bleiben standardmäßig im lokalen Gastmodus mit optionaler Profilanmeldung; sie sind nicht die Sync-Abnahmeversion.

App-Dateiupdates werden vorbereitet und erst nach Schließen aller alten App-Fenster aktiviert. Bei einer älteren Ansicht unter „App installieren, Updates & Hilfe“ nach Updates suchen, alle Eúzēn-Testfenster schließen und neu öffnen. Browserdaten nicht löschen.

## Prüfungen und Betrieb

```sh
npm test
npm run check
npm run build
npm run format:check
```

[Abnahmebelege](docs/ACCEPTANCE-0.6.md) · [Architektur und Grenzen](docs/SYNC-ARCHITECTURE.md) · [iPhone-/Android-Testablauf](docs/DEVICE-TESTS.md).

Trainingsdaten werden lokal in IndexedDB gespeichert und bei aktiviertem Kontosync an das freigegebene Supabase-Testprojekt übertragen. Offline-Änderungen bleiben in einer Outbox. Backups zusätzlich exportieren; verweigert der Browser jede Speicherung, sind ungespeicherte Änderungen nur bis zum Schließen der Seite im Arbeitsspeicher verfügbar.

Keine KI-, News- oder Gesundheitsdienste angeschlossen. Keine Produktionsveröffentlichung und kein App-Store-Release. Historische Zwischenstände unter docs/history/ sind keine aktuellen Statusangaben.
