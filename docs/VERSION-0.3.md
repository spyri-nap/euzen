# Version 0.3 – geführte Zeitblöcke und Satzvorgaben

Im Builder lassen sich EMOM-, Intervall- und Countdown-Blöcke auf „Zeitblock automatisch durchlaufen“ stellen. Vorbereitungszeiten sind je Block einstellbar. Für Sätze und Runden können Reps und Last je Satz/Runde einzeln vorgegeben werden. Ein Timer-Ende erzeugt keine automatisch absolvierte Leistung.

## Durchlauf und Bestätigung

Der Timer rechnet Übergänge anhand fester Endzeitpunkte nach. Bei Rückkehr aus einem anderen Tab werden verstrichene Fenster nachgeholt, ohne Signalgarantie im Hintergrund. Pause hält diesen Ablauf an. Vorbereitungszeit zählt zur protokollierten Sessionzeit; sie erzeugt keinen Arbeitsschritt.

Durchgelaufene Arbeitsfenster landen mit „Ausführung noch bestätigen“ in der Trainingsgeschichte. Währenddessen eingegebene Werte werden als unbestätigter Entwurf übernommen. Ohne Eingaben entstehen null Reps und null Last als Platzhalter; sie zählen nicht zu den Leistungskennzahlen. Unter Fortschritt → Einheit → Ergebnis korrigieren werden tatsächliche Werte eingegeben und „Ich habe diesen Arbeitsschritt tatsächlich absolviert“ bestätigt. Erst dann zählen sie. Sind alle Arbeitsfenster bestätigt, wird die Einheit vollständig.

Automatische Starts zwischen Blöcken erfolgen nur bei einem geführten Folgeblock oder dessen Vorbereitung. Ansonsten wartet die nächste Phase auf Start. AMRAP bleibt manuell. Bestehende Sessions behalten ihre kompilierten Phasen und alte Vorlagen erhalten beim Einlesen sichere Standardwerte für die neuen optionalen Felder.

## Prüfung und Grenzen

Tests decken Vorbereitung, mehrere verstrichene Fenster, Pausen, Wiederaufnahme, doppelte Ergebnisse, unbestätigte Kennzahlen und Satzvorgaben ab. Build und TypeScript werden geprüft. Hintergrund-Audio und Bildschirm-Wachhalten bleiben browserabhängig. Physische Smartphone-Tests und ein kompletter Accessibility-Audit sind noch offen. Die Versionsdokumente ergänzen die Regeln des ursprünglichen Grundgerüsts.

Browserprüfung auf einer getrennten Test-Origin: 2 Sekunden Vorbereitung, zwei automatisch durchlaufende 3-Sekunden-Fenster. Danach korrekt 0 bestätigte Arbeitsschritte und keine Volumenlast. Beide Fenster anschließend explizit mit je 8 Reps × 16 kg bestätigt; die Session wechselte erst danach auf „Abgeschlossen“.
