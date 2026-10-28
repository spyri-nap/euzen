# Entwicklungsprompt · Eúzēn 0.6 · Kontodaten und Synchronisierung

Du verantwortest Architektur, Implementierung und Qualitätssicherung im bestehenden Eúzēn-Repository. Implementiere den folgenden Entwicklungsschritt vollständig und überprüfbar. Bewahre bestehende Trainingsdaten und das etablierte Design. Lies zuerst AGENTS.md, diesen Prompt und die relevanten Quelldateien. Nutze die Supabase-Skills und aktuelle offizielle Dokumentation. Prüfe Annahmen am tatsächlichen Code.

## Ausgangslage am 28.10.2026

React 19, TypeScript, Vite, IndexedDB und Supabase. Branch feat/euzen-foundation und bestehender Draft-PR #1 weiterverwenden. package.json trägt noch 0.5.0; 0.6 ist nicht abgeschlossen. Node >=22.12 ist erforderlich.

Vorhanden: leere Neustarts, Einführung DE/EN, Workout-Baukasten, Planung, Player, Fortschritt und Export. src/ui/Account.tsx und src/data/auth.ts bieten OTP-Anmeldung, Profil und Abmeldung. Nutzer hat erfolgreichen E-Mail-Code-Login bestätigt. IONOS-SMTP und beide OTP-Vorlagen sind gespeichert. SPF, DKIM, DMARC und Microsoft compauth bestanden in der bereitgestellten Testmail; Outlook klassifizierte sie dennoch als Junk. Keine DNS-Reparatur ohne neue Belege.

src/data/useStore.ts verwendet weiterhin den lokalen Gastbereich. src/data/accountStore.ts enthält eine separate Konto-Partition und atomare Outbox, ist aber nicht integriert. supabase/drafts/private_training.sql ist ein überholter Entwurf: NICHT unverändert anwenden. Bisherige Profiltests belegen keine Trainingsdaten-Isolation.

Freigegebene Testumgebung: Supabase yvxzcawjtyqcljuoyfeg, eu-west-1, vorhandene Profilmigration. Lokale .env.local ist vorhanden und gitignoriert. Keine Schlüssel oder Sitzungen ausgeben. Kein neues kostenpflichtiges Projekt erstellen. Arc ist der Standardbrowser. Historische Dokumente HANDOFF.md und VERSION-0.6-PREPARATION.md enthalten überholte Angaben; dieser geprüfte Ausgangspunkt hat Vorrang.

## Ziel und Umsetzung

1. Ermittle die vollständigen Datenmodelle und Persistenzpfade. Dokumentiere vor der Implementierung knapp Eigentümerschaft, Referenzen, Versionierung und Löschsemantik. Nutze bestehende Validierung und APIs sinnvoll weiter.
2. Verbinde Auth und Store über explizite Zustände: Gast, Konto wird geladen, Konto bereit, Offline und Fehler. Lade die Cloud vor einer Initialisierung mit leerem Zustand. Ein fehlgeschlagener Abruf darf niemals vorhandene Cloud-Daten überschreiben.
3. Trenne Gast- und Kontodaten strikt. Konto A darf nach Anmeldung von B weder sichtbar sein noch weiter hochladen. Invalidiere verspätete Requests durch Konto-/Generationskennung. Abmelden stoppt Sync und zeigt den getrennten Gastbereich. Bereits lokal bestätigte Änderungen bleiben bei Netzwerkfehlern erhalten.
4. Neue Konten starten leer. Bestehende Gastdaten nur über eine freiwillige Übernahme mit Mengenübersicht, Zielkonto und ausdrücklicher Bestätigung importieren. Keine automatische Zuordnung; Export und unverändertes Weiterführen des Gastbereichs anbieten. Wiederholung darf keine Duplikate erzeugen.
5. Entwickle ein nachvollziehbares, pro Entität speicherndes Datenmodell für Übungen, Workouts, Wochenpläne, Termine, abgeschlossene Sessions, Check-ins und passende Einstellungen. Keine unvalidierte AppState-Blob-Synchronisierung. Prüfe kontoübergreifende Referenzen, fachliche Grenzen, Payload-Limits und sichere Löschregeln. Abgeschlossene Sessions müssen ihre historischen Übungs-/Workout-Daten behalten können.
6. Implementiere RLS und minimale Grants für alle exponierten Tabellen. Leite Eigentümer serverseitig aus auth.uid() ab; keine Autorisierung über editierbare Metadaten. Härte RPCs, Suchpfade und Ausführungsrechte. Keine Service-Role im Frontend. Erzeuge Migrationen nach der Supabase-Anleitung und teste sie zuerst in der freigegebenen Testumgebung.
7. Speichere lokale Änderungen und Outbox atomar. Nutze stabile Operations-IDs, idempotente Verarbeitung, Revisionsprüfung und Tombstones. Bestätige Outbox-Einträge erst nach sicherem Servererfolg. Wiederanlauf bei Online-Rückkehr/App-Start; begrenzte Retries mit Backoff. Behandle echte Konflikte sichtbar mit lokaler und Serverfassung sowie Erhalt beider Fassungen, wo sinnvoll. Keine stillen Datenverluste durch Last-write-wins.
8. Zeige DE/EN-Status: lokal gespeichert, Synchronisierung ausstehend, synchronisiert oder Aktion erforderlich. Status muss der tatsächlichen Speicherung entsprechen. Bedienelemente tastatur- und screenreadertauglich, Touch-Ziele ausreichend groß. Halte Training und Timer bei Netzwechseln bedienbar.

## Nachweisbare Abnahme

Teste Gastbestand ohne Mutation, leeres neues Konto, Profil-/Kontowechsel, Abmelden während eines Requests, Reload, Offline-Änderungen und Wiederverbindung. Prüfe zwei unabhängige Clients mit demselben Konto, parallele Bearbeitung, doppelte Operationen, gelöschte Referenzen und fehlgeschlagene Uploads. Prüfe auf Datenbankebene zwei Nutzer, anonymen Zugriff, direkte Schreibversuche, manipulierte Eigentümer und kontoübergreifende Referenzen. Testidentitäten und Fixtures sauber entfernen; keine echten Nutzerdaten löschen.

Führe die vorhandene Suite, Typecheck, Produktionsbuild und Formatprüfung aus. Dokumentiere tatsächlich ausgeführte Tests getrennt von noch offenen Geräteprüfungen. Browserprüfungen auf separatem Ursprung durchführen, um den bestehenden Nutzerbestand zu schonen. Überprüfe auf echtem iPhone und Android erst, wenn Geräte verfügbar sind; niemals simulierte Tests als Gerätetests bezeichnen.

## Abschluss und Grenzen

Aktualisiere Übergabe, Auth-Dokumentation und 0.6-Status zu einem widerspruchsfreien Stand. Berichte Änderungen, Testbelege und verbleibende Grenzen. Konto-Löschung, vollständiger Cloud-Reset und öffentliche Veröffentlichung sind Folgepakete: Das Datenmodell soll sie ermöglichen, diese Funktionen aber nicht ungeprüft als fertig ausweisen. Generationsschutz gegen das Wiederhochladen zurückgesetzter Daten einplanen.

Keine Zusammenführung nach main und keine Produktionsveröffentlichung. Einen geschützten Preview nur nach Prüfung des tatsächlichen Zugriffsschutzes als geschützt bezeichnen. Keine Behauptung vollständiger 0.6-Freigabe vor erfolgreicher Ende-zu-Ende-Abnahme.

## Lokaler Start

Im Repository Node >=22.12 aktivieren, bei fehlenden Abhängigkeiten npm ci ausführen. Anschließend npm test, npm run check und npm run build. Entwicklung mit npm run dev; belegten Port nicht durch Beenden fremder Prozesse freimachen. .env.example enthält ausschließlich öffentliche Platzhalter; .env.local niemals committen.
