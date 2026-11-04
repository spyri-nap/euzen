# Regeln für Training und Auswertung

## Aufbau und Reihenfolge

Eine Übung beschreibt die Bewegung. Eine Vorgabe beschreibt Reps, Last, Gewichteanzahl, Seite, Distanz, Tempo und Ziel-RPE/RIR. Ein Block legt Modus, Zeit, Durchgänge und Pausen fest. Die Block- und Übungsreihenfolge im Builder ist die Reihenfolge im Player. Abschnittstitel (Warm-up, Hauptteil, Cool-down) sind editierbare Bezeichnungen und sortieren nichts automatisch.

Für einen eigenen Modus je Übung wird ein separater Block angelegt. Mehrere Übungen in einem Block bilden ein Supersatz-/Zirkel-Muster. Sätze werden in dieser Version durchgangsweise interleaved ausgeführt: A1, B1, A2, B2. Klassische aufeinanderfolgende Sätze pro Übung lassen sich über je einen Block pro Übung anlegen.

| Modus        | Arbeitsschritt                                                                         | Erholung                                               | Weitergehen                                                     |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Sätze & Reps | Je Übung und Durchgang ein manuell bestätigter Satz                                    | Konfigurierte Pause nach jeder Übung außer der letzten | Manuell                                                         |
| Runden       | Je Übung und Runde ein manuell bestätigter Satz                                        | Übergang innerhalb der Runde, Pause zwischen Runden    | Manuell                                                         |
| Countdown    | Zeit je Übung und Durchgang                                                            | Übergang innerhalb der Runde, Pause zwischen Runden    | Nach Ablauf bestätigen                                          |
| Intervalle   | Arbeitszeit je Übung und Durchgang                                                     | Übergang innerhalb der Runde, Pause zwischen Runden    | Nach Ablauf bestätigen                                          |
| EMOM         | Ein Zeitfenster je Übung und Durchgang, standardmäßig 60 Sekunden, frei konfigurierbar | Restzeit innerhalb dieses Fensters                     | Nach Ablauf bestätigen; nächstes Fenster manuell starten        |
| AMRAP        | Ein Zeitfenster für genau eine Übung                                                   | Nach persönlichem Bedarf über Pause                    | Volle Runden zählen, Teil-Reps ergänzen, nach Ablauf bestätigen |

Beim Wechsel zum EMOM-Modus wird ein klassisches 60-Sekunden-Intervall vorgeschlagen. Die Länge bleibt frei konfigurierbar und ist sichtbar. Jeder weitere Wechsel in diesen Modus setzt den Vorschlag erneut auf 60 Sekunden.

AMRAP-Reps = volle Runden × Reps je Runde + Teil-Reps. Teil-Reps müssen kleiner sein als die Reps einer vollen Runde. Die Runde im Ergebnisdatensatz identifiziert das Zeitfenster; `roundsCompleted` hält die gezählten Runden fest.

## Timer

Die Zustände sind `idle`, `running`, `paused`, `expired`. Der Timer berechnet verstrichene Zeit aus gespeichertem Startzeitstempel und kumulierter Zeit. Die Anzeige aktualisiert sich regelmäßig; sie ist nicht die Zeitquelle. Pausen zählen nicht weiter. Die Betriebssystemzeit sollte während einer Session nicht manuell verändert werden.

Ein abgelaufenes Zeitfenster bleibt stehen und wartet auf Bestätigung. Das verhindert automatisch als erledigt markierte Schritte beim Wechsel in einen anderen Tab. Ein Neuladen erhält Phase, Timer, bestätigte Ergebnisse und den Eingabeentwurf. Der Startbereich bietet die Wiederaufnahme an.

„30 s Zeit“ verlängert ein Zeitfenster um 30 Sekunden und pausiert es. Das funktioniert auch nach Ablauf. Tatsächlich bereits verstrichene Zeit bleibt erhalten. Die Fortsetzung erfolgt bewusst per Klick. Zusätzliche Erholung ist jederzeit über Pause möglich.

Das Training enthält nur Zeiten, in denen der jeweilige Timer läuft, einschließlich gestarteter Restphasen. Pausieren, Protokollieren nach Ablauf und Warten vor dem nächsten Start zählen nicht zur aktiven Trainingsdauer. Beim Wiederöffnen nach langem Hintergrundaufenthalt wird die Zeit eines abgelaufenen Fensters auf dessen Endzeit begrenzt. Zeitangaben bei Arbeitsergebnissen sind die protokollierten Timersekunden, keine automatische Messung der tatsächlichen Bewegung.

Timer-Töne sind optional. Browsereinschränkungen bei Audio und Hintergrundbetrieb bleiben bestehen. Es gibt keine garantierten Signale bei gesperrtem Bildschirm.

## Abschluss und historische Daten

Start erzeugt tiefe Kopien von Workout und verwendeten Übungen. Spätere Änderungen an Vorlagen oder Techniknotizen ändern die Historie nicht. Ergebnisse werden je stabiler Phasen-ID genau einmal gehalten. Der Abschluss einer bereits beendeten Session ist idempotent.

Überspringen protokolliert den betreffenden Arbeitsschritt als übersprungen. Ein Workout mit übersprungenen Arbeitsschritten wird beim letzten Schritt als unvollständig gespeichert. Vorzeitiges Beenden speichert bestätigte Teilergebnisse; der gerade noch nicht bestätigte Schritt zählt nicht als Ergebnis.

Freie Mobility-Einträge und Ruhetage sind Kalendernotizen, keine Trainingsergebnisse. Für messbare Mobilität ein Mobility-Workout anlegen. Es gibt keine automatische Umplanung verpasster Sessions.

## Kennzahlen

- Abgeschlossene/unvollständige Workouts: ausschließlich beendete Sessions nach Status.
- Trainingstage: unterschiedliche lokale Daten der Session-Startzeit mit mindestens einem nicht übersprungenen Ergebnis. Ein Workout über Mitternacht zählt am Starttag. Eine spätere Änderung der Gerätezeitzone kann die Zuordnung beeinflussen.
- Trainingszeit: Summe gespeicherter `activeMs` / 60.000. Teil-Sessions sind enthalten. Aktive, noch nicht abgeschlossene Sessions nicht.
- Volumenlast: tatsächliche Reps × Zusatzlast je Gewicht × Anzahl der Gewichte, nur für Übungen mit Messgrößen `load` und `reps`. Körpergewichtsanteile werden nicht geschätzt. Carries werden nicht in ein fiktives Reps-Volumen umgerechnet.
- Keine geeigneten Volumendaten: `null`, Anzeige „—“. Geeignete Last mit tatsächlich null Reps ergibt dagegen den bekannten Wert 0.
- Bewegungsprofil: Anzahl nicht übersprungener Arbeitsschritte pro Trainingsdimension/Bewegungsmuster, kein medizinischer oder physiologischer Belastungsscore.
- Planerfüllung: aktuell im Plan vorhandene bis heute fällige Workout-Einträge versus davon vollständig abgeschlossene Einträge. Mehrere Sessions für denselben Planeintrag erfüllen ihn nur einmal. Entfernung oder Verschiebung eines Planeintrags verändert diese Kalenderkennzahl, nicht die Sessionhistorie.
- Zeitraumfilter 28/56 Tage: inklusive heute, nach lokalem Startdatum.

Vergleiche setzen dieselbe Übungs-ID, Equipment, Messgrößen, Blockmodus, Blockumfang, Zeit-/Pausenvorgaben, Reihenfolge/Position innerhalb des Blocks, Seite, Gewichteanzahl und Tempo voraus. Last und tatsächliche Reps dürfen variieren; bei abweichender Last wird das benannt. Die Ansicht zeigt Einzelwerte und die Differenz der Reps, keinen daraus abgeleiteten Gesundheitsgewinn. Zusätzlich genommene Pausen sind nicht normiert. Für genaue Leistungsvergleiche die tatsächlichen Zeit- und Anstrengungswerte in den Ergebnissen prüfen.

## Backups

Schema-Version 1. JSON-Imports sind auf 15 MB begrenzt. Struktur, Wertebereiche, gültige Kalenderdaten, eindeutige IDs, Übungs-/Vorlagen-/Phasenreferenzen und Sessionstatus werden geprüft, bevor Daten ersetzt werden. Unbekannte Schema-Versionen werden abgelehnt. Die Migration für Version 1 ist eine geprüfte Identitätsmigration; spätere Versionen benötigen explizite Migrationen.

Vor dem bestätigten Ersetzen wird ein Export des aktuellen Stands ausgelöst. Der Browser kann Downloads blockieren; die Sicherungsdatei vor einem wichtigen Import kontrollieren. Kein automatisches Zusammenführen.
