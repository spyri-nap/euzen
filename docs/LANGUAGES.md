# Sprachwahl · erster Ausbau

In Einstellungen & Daten → Sprache der Oberfläche: Deutsch / English. Die Auswahl wird in `preferences.language` in IndexedDB und im JSON-Backup gespeichert. Alte Daten ohne Feld erhalten Deutsch; unbekannte Sprachwerte werden abgelehnt. Die Änderung ist rückwärtskompatibel innerhalb Schema 1. Ältere App-Versionen kennen dieses Feld nicht und können es bei erneutem Speichern entfernen.

Navigation und statische Oberflächentexte verwenden einen expliziten lokalen englischen Katalog. Deutsche Quelltexte bilden den Fallback. Keine externe Übersetzung, keine DOM-Manipulation. Dokumentensprache, Titel und Intl-Datums-/Zahlenformat folgen der Auswahl. Kanonische Werte für Dimension, Modus und Seite werden nicht in den Daten übersetzt; übersetzte Selects behalten ihre ursprünglichen `value`-Attribute.

Eigene Namen, Beschreibungen und Notizen sowie historische Session-Snapshots bleiben unverändert. Bereits gespeicherte deutsche Beispielinhalte bleiben ebenfalls deutsch. Einzelne zusammengesetzte Analysen, dynamische Accessibility-Beschriftungen und noch nicht katalogisierte Laufzeitmeldungen sind noch deutsch: **keine vollständige englische Lokalisierung behauptet**. Nächster Schritt: parametrisierte Nachrichten und Pluralformen statt zusammengesetzter Textfragmente, Katalog-Vollständigkeitsprüfung und englische Redaktion der Beispielinhalte ohne Überschreiben bestehender Daten.

Automatische Tests prüfen Umschaltung/Fallback, Zahlen/Datum, deutsche Voreinstellung alter Backups, englischen Backup-Roundtrip und unveränderte eigene Notizen. Browserprüfung auf isoliertem QA-Ursprung: Einstellungen umgeschaltet, Dialog sofort englisch, nach Reload weiterhin englische Navigation und Datums-/Zahlenformate. Noch keine physischen iPhone-/Android-Sprachtests.

PWA-Hosting und echte Gerätetests bleiben wie in VERSION-0.5.md offen. Keine Veröffentlichung erfolgt.
