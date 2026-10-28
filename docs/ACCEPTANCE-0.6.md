# Abnahme 0.6

| Bereich                                 | Status                       | Nachweis                                 |
| --------------------------------------- | ---------------------------- | ---------------------------------------- |
| Lokale Kontopartition/Outbox            | geprüft                      | accountStore.test.ts                     |
| RPC-Isolation/Idempotenz                | teilweise geprüft            | supabase/tests/training_entity_sync.sql  |
| Gastübernahme mit Namensraum            | implementiert, lokal geprüft | reconcile.test.ts                        |
| React-Store mit IndexedDB               | teilweise geprüft            | useStore.test.tsx; Transport simuliert   |
| Server-Fachregeln und Quoten            | erweitert, teilweise geprüft | sync_integrity_limits; siehe Architektur |
| Vollständige Konflikt-UX                | teilweise implementiert      | keine Browserabnahme                     |
| Generationswechsel und mehrere Tabs     | teilweise implementiert      | weitere Tests nötig                      |
| Browser, zwei Geräte, Mobilinstallation | offen                        | keine Freigabe                           |

Lokale Basis: Node >=22.12, npm ci, npm test, npm run build. Normale App: npm run dev. Kontosync bleibt standardmäßig aus. VITE_ACCOUNT_SYNC_ENABLED nicht für Nutzerbestände aktivieren, bevor die offenen Abnahmepunkte erfüllt sind. Kein Deployment ausgelöst.

Neueste Browserbelege und Einschränkungen stehen im letzten Abschnitt von SYNC-ARCHITECTURE.md. Kontoanmeldung, Workout-/Session-Upload und unabhängiger Zweitclient-Abruf in Arc geprüft. Zwei-Client-Konfliktprüfung hat einen Fehler gezeigt; Schutz ergänzt, Wiederholungsprüfung offen. Keine Freigabe.
