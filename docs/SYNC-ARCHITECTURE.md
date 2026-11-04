# Eúzēn 0.6 · Daten und Synchronisierung

## Bereiche und Eigentümer

Gastdaten bleiben unter dem bestehenden IndexedDB-Schlüssel euzen/state/main erhalten. Kontodaten liegen getrennt nach Nutzer-ID in euzen-accounts, Datenbankversion 2. Zustand, Generation, Revisionen und Outbox werden atomar gespeichert. Das Recovery-Objekt enthält archivierte Stände und Konfliktfassungen. Daten im Browserprofil sind unverschlüsselt.

Supabase: ausschließlich freigegebenes Testprojekt yvxzcawjtyqcljuoyfeg. Öffentlicher Publishable Key im Client, keine Service-Role. Ein gemeinsamer SDK-Client mit persistierter OTP-Sitzung. Explizite lokale Abmeldung führt zum Gastbereich; Ablauf der Anmeldung erhält das lokale Konto zum Weitertrainieren und hält Uploads bis zur erneuten Anmeldung an.

## Protokoll

Einzelne Entitäten: exercise, workout, week, scheduled, session, checkin und settings. Stabile Operations-IDs, erwartete Revision, Generation und Tombstones. Keine unvalidierte AppState-Blob-Synchronisierung. Neue Referenzziele vor ihren Nutzern speichern, abhängige Einträge vor Eltern löschen. Serverantworten bestätigen eine Operation erst nach erfolgreichem Commit. Wiederholung einer bereits bestätigten Operation liefert denselben Beleg. Andere Payload unter derselben ID wird abgewiesen.

Private Tabellen im Schema euzen_sync mit RLS und ohne Client-Schema-Grants. Öffentlich aufrufbare Pull-/Push-RPCs sind SECURITY DEFINER mit leerem search_path und expliziter auth.uid()-Prüfung. Keine Autorisierung über user_metadata. Kontoschreibvorgänge werden über die Kontozelle serialisiert.

## Validierung und Grenzen

JSON-Schemata plus serverseitige Fachregeln für IDs, Workout-Schrittzahl/AMRAP, Kalenderdaten, Session-Snapshots, Phasen/Ergebnisse und Timer-/Abschlusskonsistenz. Referenzen auf fremde Konten oder fehlende aktive Übungen/Workouts werden abgewiesen. Sessions enthalten eigene historische Snapshots. Client validiert zusätzlich den rekonstruierten Gesamtzustand.

Pro Konto maximal 64 MiB Entitätspayload, 100.000 Operationsbelege oder 128 MiB Belegdaten. Pro Payload 2 MB. Sammlungslimits entsprechen dem Client: 10.000 Übungen/Sessions, 1.000 Workouts/Wochenpläne, 20.000 Termine/Check-ins, eine Präferenzentität. Zusätzlich maximal 50.000 Entitätszeilen einschließlich Tombstones. Quotenfehler stoppen neue Übertragungen; bestätigte Daten bleiben erhalten. Keine automatische Beleg-/Tombstone-Bereinigung, die Offline-Clients oder Idempotenz gefährdet.

## Lokale Sicherheit

Web Lock erlaubt nur einem Dokument das Schreiben. Andere Tabs bleiben lesend, auch in Einstellungen. Nach Schließen der alten Fenster und Reload übernimmt ein neuer Client. Ein aus dem Back/Forward-Cache zurückkehrendes Dokument wird bis zum Reload lesend. Ohne Web Locks wird nicht geschrieben.

Kontowechsel invalidieren Requests sofort; Eigentümer und Generation werden beim Einreihen festgehalten. Neue Cloud-Bestände werden nie aus einem fehlgeschlagenen Abruf als leer interpretiert. Lokale Änderungen während eines Pulls verhindern dessen Übernahme. Lokale Speicherfehler blockieren Upload/Pull, bis die Änderungen tatsächlich gesichert sind. Bei komplett verweigerter Speicherung bleibt ein kontogetrennter temporärer RAM-Stand im aktuellen Dokument; er überlebt keinen Seiten-Neustart. Dann Backup exportieren.

Bearbeitungsbasen sind unveränderlich: Übungen, Workouts, Planänderungen, Check-ins und Backup-Wiederherstellung behalten ihre ursprünglichen Revisionen. Workout-Entwürfe sind nach Konto und Generation getrennt und speichern die Basis mit. Ein bereits gespeicherter neuer Entwurf wird als neue Kopie wiederhergestellt, statt versehentlich eine spätere Serverfassung zu überschreiben. Entwürfe werden erst nach bestätigter lokaler Speicherung entfernt.

## Konflikte, Übernahme und Recovery

Konflikte zeigen die neueste lokale und die Serverfassung. Auswahl lokal erzeugt eine neue Operation auf der Konfliktrevision und kann erneut konfligieren. Auswahl Server entfernt ausschließlich Operationen der betroffenen Entität. Beide Fassungen und der vorherige lokale Stand werden zuvor atomar archiviert. Serverübernahme erfordert zusätzlich einen vorherigen Export. Archivierter Export enthält gegebenenfalls recoveryConflict; normale Backup-Leser können weiterhin den vollständigen lokalen Zustand lesen.

Neue Kontogenerationen werden vor dem Replay alter Operationen erkannt. Eine ausdrückliche Übernahme archiviert Zustand und Outbox der alten Generation atomar. Alte Uploads werden serverseitig abgewiesen. Dies ist Wiederherstellung nach einem externen Generationswechsel, kein neuer Cloud-Reset oder Konto-Löschmechanismus.

Gastübernahme ist freiwillig mit Zielkonto, Mengenübersicht, Backup und Bestätigung. Ein stabiler Namensraum für einen vollständigen Quellbestand vermeidet ID-Überschreibungen und erhält Referenzen/Snapshots. Identische Wiederholung erzeugt keine Duplikate. Ein geänderter Quellbestand wird bewusst als neue Kopie importiert. Abweichende Check-ins am selben Tag und zwei aktive Sessions müssen zuvor geklärt werden; ein Abbruch verändert keine Quelle.

## Bereitstellung

`npm run build:test` erzeugt dist-test mit aktivem Testkontosync. `npm run preview:test` stellt die isolierte Produktions-PWA auf Port 5186 bereit. Normale Builds bleiben standardmäßig im Gastmodus. Service Worker speichert nur eigene Build-Dateien, keine Supabase-Antworten, und aktiviert Updates erst nach Schließen aller alten Clients.

Aktuelle Nachweise: ACCEPTANCE-0.6.md. Historische Zwischenstände sind unter history/ archiviert und nicht verbindlich.
