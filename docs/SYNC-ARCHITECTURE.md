# Kontospeicherung und Sync · Architektur

Alle Trainingsentitäten gehören genau einem Konto. Der bisherige Gastschlüssel bleibt unverändert. Eine Kontopartition enthält Zustand, Generation und atomare Outbox. Historische Sessions enthalten bereits eigene Workout- und Übungssnapshots und überleben daher Bibliotheksänderungen.

Transportformat: einzelne Entitäten exercise/workout/week/scheduled/session/checkin/settings; Check-in-ID ist das Kalenderdatum, Settings-ID `preferences`. Jede Änderung erhält eine stabile Operations-ID, erwartete Revision und Generation. Löschungen werden als Tombstones übertragen. Wiederholungen müssen serverseitig dieselbe Bestätigung liefern. Lokale Folgeänderungen derselben Entität dürfen eine bereits gestartete Operation nicht mutieren.

Referenzen: Workouts auf Übungen und Termine auf Workouts müssen innerhalb desselben Kontos geprüft werden. Sessions verwenden ihre Snapshots. Eine vollständige Revisions-/Generationsprüfung und Referenzvalidierung muss atomar serverseitig erfolgen; ein clientseitiger Check ersetzt das nicht. Alte Uploads nach Reset müssen abgewiesen werden.

Sicherheitsgrenze: Die neue reine Sync-Logik wird erst nach geprüfter Datenbankmigration mit einem Cloud-Transport verbunden. Bis dahin kein automatischer Trainingsupload. Fehlender Cloud-Abruf darf nie als leeres Konto interpretiert werden. Konflikte erhalten beide Fassungen; Outbox bleibt bis zur erfolgreichen Bestätigung erhalten.

## Verifizierter Zwischenstand · 28.10.2026

Migration `20261028094132_training_entity_sync.sql` im freigegebenen Testprojekt angewendet. Privates Schema mit RLS ohne Client-Policies und ohne Schema-Grants: Zugriff absichtlich ausschließlich über RPC. JSON-Schemata aus den aktuellen Zod-Modellen generiert; Zod-superRefine-Regeln werden dabei nicht vollständig zu SQL-Validierung übersetzt. Client prüft zusätzlich den rekonstruierten Gesamtzustand. Vollständige serverseitige Fachregeln stehen noch aus.

RPCs prüfen auth.uid(), Operationsbelege, Revisionen, Generation und ausgewählte Referenzen. Gleiche Operations-ID mit anderer Payload wird abgewiesen. Tombstones und Belege werden vorerst dauerhaft aufbewahrt; keine Bereinigung, bevor ein belastbares Geräte-/Reset-Konzept vorliegt. Fehlende Quoten für Belege und Gesamtbytes sind vor Freigabe zu ergänzen.

Transport und Auth-/Store-Anbindung implementiert, aber nur über VITE_ACCOUNT_SYNC_ENABLED=true aktivierbar. Standardmäßig aus, weil integrierte Browserabnahme, Konfliktauflösung, Gastübernahme, detaillierter Status und Backoff fehlen. Nicht für Nutzertests aktivieren. Laufende Sessions werden beim Pull vor Überschreiben geschützt. Generationenwechsel mit ausstehender Outbox und Transaktionskonflikte benötigen weitere Behandlung. Kein vollständiges 0.6-Release.

Nachweise: 83 lokale Tests, TypeScript, Build und Formatprüfung bestanden. SQL-Test training_entity_sync.sql im Testprojekt bestanden: idempotente Wiederholung, Revisionskonflikt, veraltete Generation, ungültige Payload, fremder Eigentümer, direkter Tabellenzugriff, zweiter Nutzer und anonymer RPC-Zugriff. Testdaten vollständig zurückgerollt. Keine Zwei-Geräte- oder Browserabnahme erfolgt.

Security Advisor: vier INFO-Hinweise für bewusst geschlossene private RLS-Tabellen; zwei WARN-Hinweise für bewusst authentifiziert aufrufbare SECURITY-DEFINER-RPCs. Eigentümerprüfung und leerer search_path vorhanden. Zusätzlicher Hinweis zu projektweit deaktivierter Leaked-Password-Prüfung, bei diesem OTP-Ablauf unverändert gelassen. Kein behaupteter sauberer Gesamt-Audit.

## Fortsetzung: Konflikte und Gastübernahme

Sync-Status im Hauptlayout angeschlossen. Einstellungen enthalten experimentelle Konfliktansicht mit lokaler/Server-Auswahl und Gastübernahme mit Zielkonto, Mengenübersicht, Backup-Schritt und Bestätigung. Kollidierende IDs mit abweichenden Inhalten brechen die Übernahme verlustfrei ab; automatische Umbenennung und Erhalt beider Fassungen innerhalb des Kontos sind noch offen. Der Gastbestand bleibt unverändert. Settings bleiben im Zielkonto erhalten.

Konfliktauflösung erfolgt in einer IndexedDB-Transaktion, entfernt nur Operationen der betroffenen Entität, erhält fremde Änderungen und verwendet die aktuelle Konfliktrevision. Lokale Folgeänderungen werden in einer neuen Operation zusammengefasst. Ungültige Serverübernahmen werden durch Gesamtvalidierung abgewiesen. Neue Tests für idempotenten Import, Kollisionen und Konfliktauflösung bestehen. Insgesamt 87 Tests.

Kontowechsel invalidieren laufende Antworten sofort; Schreibgeneration wird vor dem Einreihen festgehalten. Sync-Anforderungen während eines laufenden Durchgangs werden vorgemerkt. Wiederholungen für Fehler ohne permanenten Servercode sind begrenzt und verwenden exponentiellen Backoff mit Jitter. Vollständige Fehlerklassifikation, Offline-Statuswechsel, mehrere Tabs, Generationswechsel mit Outbox und Auth-/Store-Integrationstests sind noch nicht abgenommen.

Flag weiterhin standardmäßig deaktiviert. Keine Browser-/Zwei-Geräte-Abnahme, keine vollständige serverseitige Fachvalidierung oder neue Quotenmigration in dieser Fortsetzung. Daher weiterhin keine Freigabe als fertige 0.6.

## Aktuellster Stand: Store-Integrationstests und Import-IDs

89 Tests bestehen, darunter zwei DOM-Integrationstests mit echtem React-Hook und IndexedDB, aber simuliertem Auth-/Cloud-Transport. Sie prüfen isolierte Kontospeicherung, unangetasteten Gastbestand, Abmelden sowie verspätete Antworten nach Kontowechsel. jsdom 27.0.1 als exakte Entwicklungsabhängigkeit ergänzt; npm-Audit bei Installation ohne Befund.

Gastentitäten werden jetzt in einem stabilen Namensraum für den jeweiligen vollständigen Quellbestand importiert. IDs und interne Referenzen werden gemeinsam umgesetzt. Identische Wiederholung überspringt vorhandene identische Entitäten. ID-Kollisionen mit Kontodaten überschreiben nichts. Unterschiedliche Check-ins am selben Datum werden weiterhin als expliziter Fehler behandelt; zwei aktive Sessions sind nicht zulässig. Ein veränderter Gastbestand erzeugt einen neuen Import-Namensraum; inkrementeller Import ist noch nicht umgesetzt.

Änderungsoperationen werden innerhalb eines Änderungsbatches nach Referenzabhängigkeit geordnet: neue Eltern zuerst, Löschungen abhängiger Entitäten vor Eltern. Lokal fehlgeschlagene Speicherung blockiert Pull/Upload bis zur erneuten Speicherung. Offline-Konten ohne Cache und reine Lesetabs ohne Cache erhalten eine erklärende Meldung.

Weiter offen und NICHT als abgeschlossen ausweisen: vollständige serverseitige Fachregeln/Quoten, umfassende Multi-Tab-/Generationswechsel-Abnahme, neueste lokale Konfliktfassung im Vergleich, Konfliktkopie, echter Browser-/Zwei-Geräte-Test. Kontosync bleibt deaktiviert. Der Gesamtauftrag ist noch nicht abgeschlossen.
