# Version 0.2 – erstes Verbesserungspaket

- Neue Workouts im Modus Sätze: erst alle Sätze einer Übung, dann die nächste. Zirkel bleiben abwechselnd. Bestehende Session-Snapshots behalten ihre Phasen.
- Nach einer bestätigten Übung startet die nächste Phase automatisch. Pausen und Übergänge wechseln nach Ablauf automatisch weiter. Arbeitsphasen warten weiterhin auf eine bewusste Leistungsbestätigung; echte durchlaufende EMOM-/Intervall-Zeitpläne folgen separat.
- Letzter bestätigter Schritt innerhalb einer laufenden Session kann rückgängig gemacht werden. Dabei werden Ergebnisse und Timer auf den pausierten Zustand vor der Bestätigung gesetzt. Nach Neuladen oder Abschluss ist dieser Undo-Puffer nicht verfügbar.
- Gültige Builder-Entwürfe werden pro Vorlage lokal wiederhergestellt. Schließen behält den Entwurf; Speichern übernimmt ihn und entfernt den Entwurf. Der lokale Entwurf wird noch nicht im JSON-Backup exportiert. Bei ungültigen oder nicht mehr referenzierbaren Entwürfen wird die Vorlage verwendet.
- Beendete Ergebnisse können in Fortschritt → Einheit öffnen → Ergebnis korrigieren geändert werden. Summen werden neu berechnet. Eine Änderungshistorie folgt später.
- Optionales Bildschirm-Wachhalten mit sichtbarem Status, soweit vom Browser unterstützt.

Noch offen im weiteren 0.2-Ausbau: durchlaufendes geführtes Zeittraining, Vorbereitungs-Countdown, unterschiedliche Vorgaben je Satz, umfassende Undo-Historie und Tests auf physischen Smartphones. Die bisherige README beschreibt den Ausgangsstand; diese Datei dokumentiert die Änderungen des ersten Pakets.
