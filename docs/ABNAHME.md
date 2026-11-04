# Umfang und Abnahme · 22.10.2026

## Implementiert

Der Ablauf Bibliothek → eigener Builder → Wochenplanung → Player → persistierte Auswertung ist bedienbar. Startdaten enthalten zwölf Übungen, zwei klar bezeichnete Workout-Vorlagen und einen vorgeschlagenen Wochenrhythmus, jedoch keine Ergebnisdaten.

Sechs Modi sind enthalten. AMRAP ist zunächst auf eine Übung pro Block begrenzt, alle Folgeschritte werden bewusst gestartet. Formulare prüfen Werte, Reordering funktioniert über Schaltflächen und Tastatur, Dialoge verwenden die native Fokusführung. Die Darstellung hat mobile Navigation und einen Desktop-Seitenbereich.

## Automatisierte Prüfung

Vitest prüft Timer-Pause/Wiederaufnahme, Zeitstempel nach JSON-Roundtrip, Ablauf nach langer Hintergrundzeit, manuelle Counter, Verlängerungen, Phasenreihenfolge, EMOM/AMRAP, Snapshot-Isolation, idempotenten Abschluss, Tages-/Wochen-/Jahresgrenzen, Volumen, unvollständige Sessions, Vergleichbarkeit, begrenzten Coach-Kontext, Backup-Version/Referenzen und atomare IndexedDB-Speicherung mit fake-indexeddb.

TypeScript und Vite-Produktionsbuild wurden ausgeführt. Der Lockfile hält die tatsächlich aufgelösten Abhängigkeiten fest. Zusätzliche Tests für importierte Laufzeitinvarianten gehören zum selben Testlauf.

## Prüfung in der Oberfläche

Geprüft in der Browser-Vorschau mit 390 × 844 Pixeln:

- Eigenes Workout „QA · Morgenroutine“ angelegt.
- Lasten erfasst, zweite Übung ersetzt und über die Schaltfläche nach oben verschoben.
- Satzblock mit zwei Übungen und separaten Countdown-Cool-down gespeichert.
- Individuelles Workout als zusätzliche Einheit für heute eingeplant und aus dem Plan gestartet.
- Reps 10, Last 10 kg und RPE 6 erfasst, Timer pausiert und Browser neu geladen.
- Session, Timer-Pause und Eingabeentwurf korrekt wiederaufgenommen.
- Workout mit 3 Arbeitsschritten abgeschlossen; 228 kg Volumenlast geprüft (10 × 10 + 8 × 16).
- Zweite Session gestartet: vorherige vergleichbare Leistung wurde im Player angezeigt.
- Teilergebnis mit 9 Reps × 10 kg gespeichert und Session vorzeitig beendet. Gesamtbilanz: 1 vollständig, 1 unvollständig, 318 kg.

Während der Prüfung wurden ein React-StrictMode-Konflikt beim Tab-Lock und eine fehlende Workout-Vorauswahl im Planungsdialog gefunden und behoben.

Zusätzlich wurden eigene Übungen, Such-/Favoritenfilter und die Darstellung auf Desktop (1440 Pixel) geprüft. Neu gespeicherte Übungen werden unabhängig von vorher gesetzten Filtern sofort sichtbar gemacht. Einzelne Browser-Tests ersetzen kein vollständiges Accessibility-Audit.

Diese QA-Sessions existieren ausschließlich im lokalen Test-Browser. Sie werden weder im Repository noch als Seed-Daten mitgeliefert.

## Vorbereitet

Die Persistenz liegt hinter einem Adapter; historische Snapshots und Schema-Versionen sind vorgesehen. `coachContext()` liefert eine begrenzte, berechnete Datenansicht. Space erklärt die noch nicht verbundenen Dienste ehrlich. Die Web-App lässt sich später um Cloud, PWA und native Health-Integrationen erweitern.

## Offen

- Vollständiger Übersetzungskatalog und weitere Sprachen.
- AMRAP-Zirkel mit mehreren Übungen, automatisches Weiterlaufen als optionaler Modus.
- Redaktionell geprüfte Videos und größere Übungsbibliothek.
- KI-Chat, Newsfeed, persönliche Empfehlungen über längere Zeiträume.
- Authentifizierung, Cloud-Sync, Datenverschlüsselung und Mehrgeräte-Konfliktlösung.
- Service Worker, Installationsmanifest, echtes Offline-Laden und native Health-Connectoren.
- Vollständiges Accessibility-Audit mit Screenreader sowie physische iOS-/Android-Tests, Audio im Hintergrund und Langzeittests.

Das Grundgerüst ist ein überprüfbarer Entwicklungsstand, keine abschließend validierte Gesundheitsanwendung.
