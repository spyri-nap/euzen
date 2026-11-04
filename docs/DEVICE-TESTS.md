# Physische Geräteabnahme · Eúzēn 0.6

Aktualisierung 03.11.2026: Nutzer bestätigt Vercel-Schutz im privaten Safari-Fenster auf dem iPhone und erfolgreichen Ablauf mit „Hat funktioniert“. Modell/OS-Version und Einzelmessungen fehlen. Die bisherige Bestätigung gilt nicht automatisch für die neue Guide-Ergänzung. Android bleibt offen. Die folgende ursprüngliche Checkliste bleibt zur reproduzierbaren Abnahme erhalten.

Die lokale Desktop-Web-Abnahme ist durchgeführt. Die folgenden Punkte sind die physische Geräteabnahme, keine weiteren Entwicklungsfeatures. Ein iPhone ist verfügbar; eine Android-Testperson kann der Nutzer organisieren. Es wurden bisher keine physischen Tests behauptet.

## Voraussetzung

Eine vom Handy erreichbare, geschützte HTTPS-Testadresse des bestehenden Projekts mit Testprojekt-Konfiguration und aktiviertem Kontosync. Keine Produktionsveröffentlichung ist erfolgt. http://127.0.0.1:5186 und http://localhost:5186 zeigen auf dem Handy auf das Handy selbst und sind dafür ungeeignet. HTTP im lokalen Netz ersetzt die HTTPS-/Installationsabnahme nicht. Eine Bereitstellung oder Zugangserweiterung ist separat konkret zu prüfen.

## iPhone · Safari und Home-Bildschirm

1. Testadresse öffnen, leeren Gastbereich prüfen und optional eine QA-Übung anlegen.
2. Per E-Mail-Code anmelden; Code nur in der App eingeben. Bestehendes Testkonto und Synchronisierungsstatus prüfen.
3. Teilen → Zum Home-Bildschirm → als Web-App öffnen. Start ohne Safari-Adressleiste prüfen.
4. QA-Workout starten, kurz App wechseln und Bildschirm sperren. Nach Rückkehr Timer und tatsächliche Leistungsbestätigung prüfen; Hintergrundton ist nicht garantiert.
5. Nach bestätigter Offline-Vorbereitung Flugmodus aktivieren, QA-Notiz ändern, App vollständig schließen und erneut öffnen. Daten und ausstehende Änderung müssen erhalten sein.
6. Flugmodus beenden; Synchronisierung und Abruf im Desktop prüfen. Gastdaten dürfen nicht automatisch dem Konto zugeordnet sein.
7. Deutsch/Englisch wechseln, Navigation, Formulare, Tastatur, Dialogschließen und größere Systemschrift prüfen.

## Android · Chrome und installierte PWA

Denselben Ablauf durchführen. Installation über Browsermenü/App installieren. Verhalten nach App-Wechsel, Displaysperre, Offline-Neustart und Wiederverbindung ausdrücklich auf dem tatsächlichen Gerät prüfen.

## Ergebnis protokollieren

Gerätemodell, Betriebssystem, Browser-Version, Build-ID, Datum, Schritt, erwartetes und tatsächliches Ergebnis. Bei Fehlern keine Codes oder Sitzungen teilen. Simulationen als Simulation bezeichnen. Für einen Gerätefehler einen konkreten reproduzierbaren Befund liefern, keinen neuen Gesamtprompt.
