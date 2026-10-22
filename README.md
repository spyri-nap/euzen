# Eúzēn · εὖ ζῆν

Aktueller Entwicklungsstand: **0.3**. [Version 0.2](docs/VERSION-0.2.md) ergänzt Entwürfe und Ergebniskorrekturen; [Version 0.3](docs/VERSION-0.3.md) ergänzt automatische Zeitblöcke, Vorbereitung und Satzvorgaben. Diese Versionshinweise ersetzen die betreffenden ursprünglichen 0.1-Regeln unten.

Ein persönlicher Raum für funktionelles Training und ein gutes Leben in Bewegung. Das Grundgerüst bildet einen vollständigen Ablauf ab: Übungen auswählen, Workout konfigurieren, Woche planen, trainieren und echte Ergebnisse auswerten.

## Lokal starten

Node.js 20.19+ oder 22.12+ verwenden (getestet mit 20.19.4).

```sh
npm ci
npm run dev
```

Die angezeigte lokale URL öffnen. `npm run build` prüft TypeScript und erstellt `dist/`. `npm run preview` zeigt diesen Build. Die App benötigt einen sicheren Kontext: HTTPS oder localhost, insbesondere für Web Locks und UUIDs.

```sh
npm test
npm run check
npm run format:check
```

## In Version 0.1 enthalten

- Deutsche responsive Oberfläche: Heute, Planung, Bibliothek, Fortschritt, Space.
- Zwölf kuratierte Übungsvorlagen, Suche, Equipment-/Dimensionsfilter, Favoriten, eigene Übungen, Tags und persönliche Techniknotizen.
- Eigene Workouts mit Abschnitten und frei sortierbaren Blöcken/Übungen; Austausch, Duplizieren, Last, Gewichteanzahl, Reps, Zeit, Pause, Übergänge, Runden, Seite, Distanz, Tempo und optional RPE/RIR.
- Sechs Ausführungsmodi: Sätze, Runden/Zirkel, Countdown, Intervalle, EMOM und AMRAP. Der Modus gilt für einen Block; für einen anderen Modus eine Übung in einen neuen Block legen.
- Individuelle benannte Wochen, mehrere Einheiten am Tag, Verschieben, Erholungstage, freie Mobility-Pausen und Kopieren in die Folgewoche.
- Fokussierter Player mit Start, Pause, Wiederaufnahme, manueller Bestätigung, zusätzlicher Zeit, Überspringen, gespeichertem Eingabeentwurf und vorzeitigem Abschluss.
- Unveränderliche Vorlagen- und Übungssnapshots je Session, echte Ergebnisprotokolle, geeignete Leistungsvergleiche, Volumenlast und Bewegungsmuster-Abdeckung.
- Lokale IndexedDB-Speicherung, geprüfte JSON-Backups, Importvorschau und Sicherung vor Ersetzen.
- Space mit transparenten regelbasierten Reflexionen, Datenzusammenfassung und verlinkten WHO-/NHS-Grundlagen.
- Tastaturbedienung, beschriftete Controls, native Dialoge mit Fokusführung, reduzierte Bewegung und optionaler Ton.

Die Beispiel-Workouts und der erste Wochenplan sind ausdrücklich als Einstiegsvorlagen gedacht. Es wird **keine Trainingshistorie** vorgefüllt.

## Architektur

```text
src/
  App.tsx              Navigation, Heute, Check-in, Dateneinstellungen
  domain/model.ts      Typen, Zod-Schemas, Referenzprüfung, lokale Kalenderdaten
  domain/seed.ts       Übungs- und Workout-Vorlagen ohne erfundene Ergebnisse
  domain/timer.ts      Phasencompiler und Timer-Zustandsmaschine
  domain/analytics.ts  Kennzahlen, Vergleichbarkeit, begrenzter Coach-Kontext
  data/storage.ts      Versionierter IndexedDB-Adapter und Backup-Validierung
  data/useStore.ts     Zustand, geordnete Schreibvorgänge und Tab-Schreibschutz
  ui/                  Baukasten, Bibliothek, Planung, Player, Auswertung, Space
```

React, TypeScript und Vite bilden die Oberfläche. `idb` kapselt IndexedDB; Zod validiert gespeicherte Daten und Imports. Die grafischen Elemente sind selbst erstelltes SVG/CSS, Icons stammen aus Lucide. Es werden keine externen Schriftarten oder Bilder geladen. Die deutsche UI ist nach Funktionsbereichen organisiert; ein vollständiger Übersetzungskatalog ist noch offen.

Es gibt eine einzige aktive Session. Web Locks verhindern in unterstützten Browsern parallele Bearbeitung durch einen zweiten Tab. Ohne Web Locks sollte nur ein Tab verwendet werden. Die Speicherung erfolgt in geordneten Transaktionen; Fehler werden sichtbar gemeldet. Nach einer Änderung kurz auf die erfolgreiche Speicherung achten. Änderungen unmittelbar vor einem erzwungenen Browserende sind nicht garantiert.

## Grenzen und vorbereitete Erweiterungen

Die App ist ein lokal arbeitendes Grundgerüst. Kein Login, Cloud-Sync, Service Worker, Offline-Installationspaket, freier KI-Chat, Newsfeed oder Health-Connector ist aktiviert. Der schreibgeschützte `coachContext()` liefert nur berechnete Summen, keine freien Notizen, Identifikatoren oder Roh-Check-ins. Ein späterer Anbieter muss serverseitig angebunden werden und eine bewusste Datenfreigabe erhalten.

AMRAP unterstützt zunächst **eine Übung pro Zeitfenster** mit vollständigen Runden und zusätzlichen Teil-Reps. Mehrere Übungen als AMRAP-Zirkel und ein automatischer Repetition-Counter sind offen. Sätze und Zirkel werden manuell bestätigt. EMOM verwendet bestätigte feste Zeitfenster, keinen automatisch weiterlaufenden Workout-Player.

Trainingsdimensionen und Übungsdaten sind allgemeine Orientierung. Die App liefert keine Diagnosen, medizinischen Freigaben oder individuellen Therapiepläne. Die Seed-Workouts ersetzen keine persönliche Anpassung. Persönliche Gesundheitsdaten werden nicht extern übertragen.

Browserdaten können beim Löschen des Browserprofils verloren gehen. Regelmäßig ein JSON-Backup exportieren. Trainingsergebnisse liegen unverschlüsselt im lokalen Browserprofil; Geräte- und Browserzugriff entsprechend behandeln. Native Health-Integrationen benötigen eine spätere native Erweiterung.

## Regeln und Prüfung

- [Timer und Kennzahlen](docs/REGELN.md)
- [Umfang und Abnahme](docs/ABNAHME.md)
- [Produktgrundlagen und Quellen](docs/PRODUKT.md)

GitHub Actions prüft Tests und Produktionsbuild bei Pull Requests und Änderungen an `main`.
