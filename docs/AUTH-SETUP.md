# Eúzēn 0.6 · aktueller Einstieg

Die lokale Web-Testversion 0.6 ist implementiert und abgenommen. Verbindlich sind [ACCEPTANCE-0.6.md](ACCEPTANCE-0.6.md), [SYNC-ARCHITECTURE.md](SYNC-ARCHITECTURE.md) und die Startanleitung in der README. Physische Gerätetests sind getrennt unter DEVICE-TESTS.md beschrieben. Historische Zwischenstände unter history/ ersetzen diesen Status nicht.

Node >=22.12; Branch feat/euzen-foundation; vorhandenes Supabase-Testprojekt yvxzcawjtyqcljuoyfeg. Arc ist der Standardbrowser. OTP-SMTP und Vorlagen sind eingerichtet. Keine Secrets ausgeben. Keine Nutzerdaten löschen und keine automatischen Cloud-Resets durchführen.

Lokaler Test: npm run build:test und npm run preview:test; bestehende Server weiterverwenden. Kein Merge, Push oder Produktionsdeployment wurde ausgelöst.
