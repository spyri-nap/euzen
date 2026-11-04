# Beta-Testmatrix · 03.11.2026

Finale Nachweise: 110 lokale Tests in 19 Dateien bestanden. Worker-Regressionsprüfung verifiziert Datenschutz-/Impressumsnavigation statt App-Shell. Preview `dpl_BP4Ud5hZk1xg3coD5Vz7UdT9NXMZ` READY, Cloud-PWA-Build `a3b763471cf4`. Arc-Browser: Dateninformationen geladen, App im leeren Gastbereich geöffnet, Guide geöffnet und per Tastatur auf Griechisch umgestellt, vollständige Inhalte und Feedback-mailto sichtbar. Kein Mailversand ausgelöst. Unabhängiger Browser bestätigt Vercel-Login. Diese Nachweise ersetzen die vorläufige Aussage zum leeren Arc-Fenster unten. Physische Geräteprüfung der Guide-Ergänzung bleibt separat.

Aktueller Gesamtlauf: 109 Tests erfolgreich, 18 Dateien. Neue Tests prüfen vollständige DE/EN/EL-Guide-Strukturen, Wiederherstellung der griechischen Sprachwahl, Wechsel auf Englisch und lokalen Feedbackentwurf ohne Anhänge. Sync-PWA-Build `2dd97dd025b3`, Formatprüfung erfolgreich. Neue Preview `dpl_9zF6rRK1otkkc83CYW3HN1iZN8tj` ist READY; unabhängiger Browserzugriff zeigt Vercel-Login. Authentifizierte App-Sichtprüfung ist noch nicht bestätigt: Arc zeigte eine leere Seite mit Manifest-Weiterleitung zur Zugriffssicherung. Die folgende Tabelle ist der vorherige Zwischenstand.

| Prüfung           | Erwartung                                               | Ergebnis / Methode                                                                  |
| ----------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Kernregression    | Datenisolation und Trainingsabläufe bestehen            | 107 Tests erfolgreich, 17 Dateien; automatisiert                                    |
| Sync-Testbuild    | TypeScript, Vite und PWA erfolgreich                    | Erfolgreich; Build 68b158fff7c7 vor Ergänzung der Dateninformationen                |
| Guide DE/EN/EL    | Vollständige zehn Schritte und Feedbacktexte            | Quelltext vorhanden; visuelle Geräteprüfung der Ergänzung ausstehend                |
| Feedback          | Nutzer prüft E-Mail-Entwurf, kein automatischer Versand | Quelltext: mailto, keine Anhänge oder Trainingsabfragen; Versand nicht durchgeführt |
| iPhone / Vercel   | Login vor Zugriff                                       | Vom Nutzer im privaten Safari-Fenster bestätigt                                     |
| iPhone / Training | Anmeldung und Testablauf funktionieren                  | Nutzer bestätigt „Hat funktioniert“; keine Modell-/OS-Details angegeben             |
| Android           | Installation, Offline und Wiederverbindung              | Reales Gerät ausstehend                                                             |
| Neue Preview      | READY, Guide und Dateninformationen erreichbar          | Neue Veröffentlichung und Abruf noch ausstehend                                     |

Die Ergebnisse der bisherigen iPhone-Version gelten nicht automatisch als Geräteabnahme der neuen Guide-Ergänzung. Vollständige rechtliche Datenschutzangaben sind eine externe Voraussetzung für Tests mit echten personenbezogenen Inhalten.
