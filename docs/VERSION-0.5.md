# Version 0.5 – mobile PWA-Testbasis

Manifest mit stabiler Root-Identität, Standalone-Modus, regulären/maskierbaren PNG-Icons und Apple-Touch-Icon. Der Build erzeugt Icons und einen inhaltsadressierten Service Worker ohne zusätzliche Laufzeit-Abhängigkeit. Root-Hosting erforderlich. Service Worker sind im Entwicklungsbetrieb nicht aktiviert. Trainingsdaten bleiben in IndexedDB, Schema 1, ohne Migration oder Cloud-Sync.

Die Produktions-App hält ihre Build-Dateien offline vor. Hilfebereich mit Installation, Backup-Hinweisen, Best-effort-Speicherpersistenz und freiwillig kopierbarer Diagnose ohne Trainingsdaten. Keine Telemetrie. Mobile Eingaben mit 16px-Schrift, größere Aktionsflächen, dynamische Viewport-Höhe und untere Safe-Area-Abstände. Auffällige Abweichungen zwischen Systemzeit und monotoner Uhr pausieren den Player vorsichtig; Geräte-Schlaf kann ebenfalls die Schutzpause auslösen. Änderungen bei vollständig geschlossener App sind so nicht erkennbar.

## Updates: konservative Abweichung vom Auftrag

Prüfung bei Registrierung, sichtbarer Rückkehr (gedrosselt) und manuell. Vorbereitung, Download, Bereitschaft und Fehler werden beschrieben. **Kein „Jetzt aktivieren“-Neustart**: Neue Worker warten, bis alle alten Fenster geschlossen sind. Kein skipWaiting/clients.claim. Auch bei aktiver Session, Formularen oder mehreren Tabs wird kein Reload erzwungen. Vor freiwilligem Schließen Speicherstatus prüfen! Frühere App-Caches bleiben vorläufig erhalten; ihre Begrenzung ist vor längerem Beta-Betrieb zu ergänzen. Fehlgeschlagene Installation entfernt nur den neuen Cache. Fremde Requests und Schreibzugriffe werden nicht abgefangen.

## Release und Installation

`npm ci`, `npm test`, `npm run build`, `npm run format:check`; Produktionsvorschau mit `npm run preview -- --port 5175 --strictPort`.

Vor Hosting feste HTTPS-Adresse und Zugriffsschutz klären. `dist/` atomar veröffentlichen, nicht während eines laufenden Builds ausliefern. HTML, Manifest und sw.js revalidieren; gehashte Assets langfristig cachen. `public/_headers` ist eine Vorlage für kompatible Hosts, wird vom Vite-Preview nicht angewendet. Header/CSP am tatsächlichen Host überprüfen; bestehende dynamische Inline-Styles bleiben erlaubt. Keine Geheimnisse oder Backups veröffentlichen.

iPhone: feste HTTPS-Adresse in Safari → Teilen → Zum Home-Bildschirm → als Web-App öffnen. Android: unterstützender Browser → Installieren / Zum Startbildschirm. Optionaler Installationsbutton nur bei passendem Browserereignis. localhost ist keine Handy-Adresse. Neue Domain oder Browserprofil bedeutet separater Speicher: JSON-Backup bewusst übertragen. Keine automatische Übernahme oder Verschlüsselung.

Nach Update-Download: Training abschließen, Speicherung abwarten, alle App-Fenster schließen, neu öffnen. Offline bleibt die gespeicherte Version. Code-Rollback mit neuem Worker ausliefern; keine destruktive Rückwärtsmigration. Regelmäßiger JSON-Export bleibt nötig.

## Prüfprotokoll / Restabnahme

- Worker-Tests: Precache, Installationsfehler, Request-Abgrenzung, Status, keine Sofortaktivierung; zusätzlicher Uhrzeitabweichungstest. Bestehende Tests bleiben erhalten.
- Desktop-In-App-Browser auf isoliertem Ursprung `127.0.0.1:5175`: Produktionsbuild zeigte Offline-Bereitschaft. Reload bei abgeschaltetem Preview-Server funktionierte. Kein vollständiger Flugmodus-Trainingstest.
- Zwei Produktionsbuilds auf demselben Ursprung geöffnet: Diagnose wechselte von `865608f3ede1` zu `f2045c89055f`. Fehlgeschlagener Zwischendownload wurde gemeldet; bisherige App blieb nutzbar. Keine vollständige Multi-Tab-/Aktivsession-Update-Abnahme.
- Offen: echte iPhone-/Android-Installation, kompletter Trainingsablauf offline, Prozessabbruch, Speicherfehler, Multi-Tab-Update, VoiceOver/TalkBack, umfassender Accessibility-Audit, Hosting-Header/CSP.
- P1-Onboarding, Trainingsvorschau, Snapshot-Neustart und zusätzliches Gesamtfeedback zurückgestellt. Präziser typisierter Update-Zustandsautomat und UI-Tests sind weiter zu härten.

Kein öffentlicher Deploy, Login, KI, News oder Health-Anschluss. Mobile Testbasis, noch keine vollständige Freigabe nach allen ursprünglichen Abnahmepunkten.
