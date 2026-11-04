# Eúzēn 0.6 · Web-Abnahme · 28.10.2026

**Bereit für einen geschlossenen lokalen Web-Test mit Testdaten.** Implementierung und Web-Abnahme innerhalb des vereinbarten 0.6-Umfangs abgeschlossen. Das ist keine Produktions- oder App-Store-Veröffentlichung. Physische iPhone-/Android-Prüfungen haben nicht stattgefunden und werden separat ausgewiesen.

## Nachweise

| Ablauf                                   | Ergebnis und Methode                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OTP-Anmeldung und Konto laden            | Nutzer hat Anmeldung auf zwei unabhängigen Arc-Ursprüngen bestätigt                                                                                     |
| Übungen, Workout, abgeschlossene Session | Browserablauf, Serverdatensatz complete/Revision 3 und Abruf im zweiten Client geprüft                                                                  |
| Ursprüngliche Bearbeitungsrevision       | Regression schlägt ohne Korrektur mit Revision 2 statt 1 fehl; besteht mit Korrektur                                                                    |
| Lokale Konfliktentscheidung              | Zwei frisch geladene Clients, unterschiedliche Notizen, sichtbarer Vergleich und anschließender Abgleich im Browser bestanden                           |
| Server-Konfliktentscheidung              | QA-Konflikt durch konkurrierenden RPC erzeugt; Browser verlangt Backup, übernimmt Serverfassung und zeigt übernommene Notiz                             |
| Wiederholte Konflikte und Löschungen     | Reconcile-/Hook-/RPC-Tests; andere lokale Operationen bleiben erhalten                                                                                  |
| Gastübernahme                            | Browser: Zielkonto, 1 Gastplan, Abbruch, Backup, Bestätigung und identische Wiederholung; Server bestätigt genau 1 importierten Plan                    |
| Import-Kollisionen und Snapshots         | Automatisiert: IDs/Referenzen umgeschrieben, Quelle unverändert, Check-in-Konflikte und zwei aktive Sessions abgewiesen                                 |
| Offline-Bearbeitung/Wiederverbindung     | Arc-Netzwerkemulation: lokale Änderung, anschließend Push/Pull HTTP 200 und Synchronisiert                                                              |
| Offline-Neustart der Produktions-PWA     | Registrierter Worker, Build 195d3368943e, DevTools Offline, vollständiger Reload mit gespeichertem Workout/Session; Netzwerk danach zurückgestellt      |
| Verlorene Bestätigung/App-Neustart       | Hook mit IndexedDB: gleiche Operations-ID wiederholt, eine Entität, leere bestätigte Outbox                                                             |
| Lokaler Speicherfehler/Retry             | Hook: ungespeicherte Ansicht erhalten, kein Cloud-Overwrite, Retry mit ursprünglicher Bearbeitungsrevision                                              |
| Konto-/Sitzungswechsel                   | Hook: verspätete Antworten ignoriert, Gastbestand getrennt; abgelaufene Anmeldung erhält lokales Training bis erneuter Anmeldung                        |
| Generation-Wiederherstellung             | Atomare Archivierung des alten Stands samt Outbox, explizite Übernahme und kontogetrennter Recovery-Export getestet                                     |
| Bearbeitungsentwürfe                     | Konto-/Generationsschlüssel, gespeicherte ursprüngliche Revision, Entfernen erst nach lokaler Speicherbestätigung getestet                              |
| Mehrtab-Betrieb                          | Browser-Lesemodus mit gesperrten Hauptaktionen; DOM-/Hook-Test sperrt zusätzlich Einstellungen; neuer Client übernimmt nach Schließen der alten Fenster |
| Serverregeln und Quoten                  | SQL-Testdateien erfolgreich im Testprojekt ausgeführt; Testtransaktionen zurückgerollt                                                                  |
| Deutsch/Englisch                         | Locale-/Konto-Tests und lokalisierte Sync-Meldungen; eigene Inhalte bleiben unverändert                                                                 |

## Gesamtlauf

107 Tests erfolgreich. TypeScript-Prüfung, normaler Produktionsbuild, isolierter Sync-Testbuild und Formatprüfung erfolgreich. Die automatisierten Store-Tests verwenden echtes React und IndexedDB in jsdom; Auth und Cloud-Transport sind dort simuliert. Sie ersetzen nicht die separat dokumentierten Browser-/SQL-Prüfungen. Der finale Produktions-Testbuild enthält zusätzliche automatisiert geprüfte Wiederherstellungs-/Entwurfsabsicherungen gegenüber dem oben genannten Browser-Build.

Supabase-Migrationsnamen und Dateiversionen wurden mit der tatsächlich angewendeten Migrationstabelle abgeglichen. Keine erneute Ausführung bereits angewendeter DDL nötig. Sicherheitsprüfung: private RLS-Tabellen ohne Client-Policies und authentifizierte SECURITY-DEFINER-RPCs sind bewusst Teil des geprüften Zugriffsmodells. Password-Leak-Prüfung ist projektweit deaktiviert; 0.6 verwendet OTP statt Passwort-Anmeldung. Kein behaupteter allgemeiner Security- oder Accessibility-Zertifizierungsaudit.

## Testgrenzen

Nur Testdaten und das freigegebene Testprojekt verwenden. Browser benötigen sicheren Kontext und Web Locks; andernfalls bleibt die Bearbeitung gesperrt. Browser-Speicher kann gelöscht oder abgewiesen werden: unabhängige JSON-Backups bleiben erforderlich. Quoten halten neue Schreibvorgänge an, ohne bestätigte Daten zu entfernen.

Eine UI-Netzwerksimulation belegt kein Betriebssystem-Hintergrundverhalten. Physisches iPhone vorhanden, Android-Testperson noch zu organisieren. Installation und Gerätesperre werden nach DEVICE-TESTS.md auf einer erreichbaren HTTPS-Testadresse geprüft. Die Loopback-Adresse dieses Rechners ist keine Handy-Testadresse.

QA-Datensätze und heruntergeladene Backups sind ausdrücklich gekennzeichnet. Keine echten Nutzerdaten wurden gelöscht. Kein Push, Merge, Produktionsdeployment oder neue kostenpflichtige Ressource wurde ausgelöst.
