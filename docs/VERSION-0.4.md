# Version 0.4 – Fortschritt mit Kontext

## Neu

- Fortschritt: Zeiträume von 7, 28 und 56 Tagen mit unmittelbar vorhergehendem, gleich langem Vergleichszeitraum. Abgeschlossene Einheiten, aktive Trainingstage, Zeit inklusive Pausen und protokollierte Volumenlast; absolute und prozentuale Veränderung nur bei vorhandener Basis.
- Wählbare Übungsverläufe mit Volumenlast, Wiederholungen, Arbeitszeit, Distanz oder mittlerer Satz-RPE, soweit geeignete Daten vorhanden sind. Zugängliche Tabellen mit kleinen relativen Balken, direktem Zugang zur Session und bestehenden Ergebniskorrekturen.
- Persönlicher Rückblick über die letzten sieben Kalendertage in Fortschritt und Space: bestätigte Bewegung, offene Bestätigungen, optional Energie und Erholung aus Tages-Check-ins, Reflexionsfrage und Zugang zur Planung.

## Berechnung und Grenzen

Kalendertage verwenden die lokale Browserzeitzone und den Trainingsbeginn. Die Intervalle sind inklusiv und überschneiden sich nicht; heutige Daten sind noch nicht tagesvollständig. Aktive und zukünftig datierte Sessions zählen nicht zur Zeitraumsauswertung. Der Wochenrückblick bleibt ein eigener Sieben-Tage-Zeitraum, unabhängig vom Fortschrittsfilter.

Übungsverläufe stammen ausschließlich aus historischen Snapshots. Getrennt werden Übung, Equipment, Seite, Gewichteanzahl, Tempo, Ausführungsmodus, automatische/manuelle Führung, Rundenzahl, Arbeit/Pause/Übergang, Übungsfolge und Position. Zusätzlich müssen Block- und Vorgaben-ID übereinstimmen: neu angelegte oder duplizierte Blöcke werden konservativ als separate Protokolle behandelt. Last und Wiederholungsziel dürfen variieren, damit Fortschritt innerhalb eines Protokolls sichtbar bleibt. Nicht erfasste Technikänderungen können nicht erkannt werden.

Unbestätigte und übersprungene Ergebnisse zählen nicht zur Leistung. Teilprotokolle sind sichtbar, werden aber aus dem letzten Zwei-Einheiten-Vergleich ausgeschlossen. Der gewählte Messwert muss für jeden erwarteten Arbeitsschritt vorhanden sein. Eine fehlende Zusatzlast wird nicht als Körpergewichts-Schätzung ergänzt. Prozentwerte bei einer Basis von null bleiben aus. RPE ist ein subjektiver Satzmittelwert, keine objektive oder medizinische Intensitätsanalyse. Der Verlauf zeigt keine 1RM-Schätzungen oder automatischen Steigerungsvorschläge.

Zeitraumsummen beschreiben die erfassten Einheiten, auch bei unterschiedlicher Workout-Zusammensetzung und unvollständigen Protokollen; sie sind kein standardisierter Leistungsvergleich. Zeit umfasst laufende Pausen und kann auch ohne bestätigte Leistung vorliegen. Außerhalb der App absolvierte Bewegung und nicht protokollierte Werte sind unbekannt. Änderungen werden neutral und ohne gesundheitsbezogene Bewertung dargestellt.

Die Reflexion ist lokal und regelbasiert. Keine KI, keine Übertragung von Check-ins, keine Nachrichtenabfrage oder Health-Anbindung. Kein neues Datenformat: bestehende Backups und Sessions bleiben erhalten.

## Verifikation

Neue Domain-Tests prüfen Kalendergrenzen, Zeitumstellung, Zukunft/aktive Sessions, fehlende Basis, Reihenfolge, Protokolltrennung, Snapshot-Erhalt, Teilprotokolle, Messwertabdeckung und Rückblick. Zusätzlich werden alle bestehenden Tests, TypeScript und Produktionsbuild ausgeführt. Browserprüfung in einem isolierten lokalen Ursprung mit vorhandenem QA-Protokoll: Zeitraumwahl, Messwertwahl, Session-Details und Space-Rückblick. Kein physisches Smartphone getestet; ein umfassender Accessibility-Audit bleibt offen.
