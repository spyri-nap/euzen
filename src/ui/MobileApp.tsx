import { t as tr } from "../i18n";
import { useEffect, useState } from "react";
type InstallEvent = Event & { prompt: () => Promise<void> };
export function MobileApp({ blocked }: { blocked: boolean }) {
  const [status, setStatus] = useState(
    "Entwicklungsansicht – Offline-Modus nur im Produktionsbuild",
  );
  const [build, setBuild] = useState("Entwicklung");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();
  const [install, setInstall] = useState<InstallEvent>();
  const [storage, setStorage] = useState("Nicht angefragt");
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    let alive = true,
      last = 0;
    const network = () => setOnline(navigator.onLine);
    const installHandler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const check = async () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 60000)
        return;
      last = Date.now();
      try {
        await (await navigator.serviceWorker.getRegistration())?.update();
      } catch {
        if (alive)
          setStatus(
            "Updateprüfung fehlgeschlagen. Gespeicherte Version weiter nutzen.",
          );
      }
    };
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("beforeinstallprompt", installHandler);
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      setStatus("Offline-Vorbereitung läuft …");
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then(async (reg) => {
          if (!alive) return;
          setRegistration(reg);
          const report = () => {
            if (alive && reg.waiting)
              setStatus(
                "Neue Version bereit. Zum sicheren Aktualisieren alle Eúzēn-Fenster schließen und erneut öffnen.",
              );
          };
          reg.addEventListener("updatefound", () => {
            if (alive) setStatus("Neue App-Dateien werden heruntergeladen …");
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed") report();
              if (worker.state === "redundant" && alive)
                setStatus(
                  "Download nicht abgeschlossen. Bisherige Version bleibt erhalten.",
                );
            });
          });
          const ready = await navigator.serviceWorker.ready;
          if (!alive) return;
          const channel = new MessageChannel();
          channel.port1.onmessage = (e) => {
            if (alive && e.data.ready) {
              setBuild(e.data.build);
              setStatus(
                "Offline verfügbar. Browserdaten weiterhin regelmäßig sichern.",
              );
              report();
            }
            channel.port1.close();
          };
          ready.active?.postMessage({ type: "STATUS" }, [channel.port2]);
          report();
        })
        .catch(() => {
          if (alive)
            setStatus(
              "Offline-Vorbereitung fehlgeschlagen. Internetzugang und Speicher prüfen.",
            );
        });
      document.addEventListener("visibilitychange", check);
    }
    return () => {
      alive = false;
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("beforeinstallprompt", installHandler);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return (
    <details className="mobile-help panel">
      <summary>{tr("App installieren, Updates & Hilfe · Version 0.5")}</summary>
      <p role="status">
        {online ? tr("Netzwerk laut Gerät verfügbar") : tr("Offline")} ·{" "}
        {tr(status)}
      </p>
      <p>
        {tr(
          "iPhone: Diese feste App-Adresse in Safari öffnen → Teilen → Zum Home-Bildschirm → als Web-App öffnen. Android: Browsermenü → App installieren / Zum Startbildschirm. Bezeichnungen können abweichen.",
        )}
      </p>
      {install && (
        <button
          className="btn"
          onClick={() => {
            void install.prompt();
            setInstall(undefined);
          }}
        >
          {tr("App installieren")}
        </button>
      )}
      <button
        className="btn"
        disabled={!registration || blocked}
        onClick={async () => {
          setStatus("Updateprüfung läuft …");
          try {
            await registration?.update();
            setStatus(
              registration?.waiting
                ? "Neue Version bereit: alle App-Fenster schließen und erneut öffnen."
                : "Prüfung abgeschlossen; ein Download kann noch laufen.",
            );
          } catch {
            setStatus("Updateprüfung nicht möglich. Später erneut versuchen.");
          }
        }}
      >
        {tr("Nach Updates suchen")}
      </button>
      {blocked && (
        <p>
          {tr(
            "Training, Speichern, Fehler oder Editor aktiv: erst abschließen. Kein erzwungener Neustart.",
          )}
        </p>
      )}
      <p>
        {tr(
          "Updates werden absichtlich erst aktiviert, wenn alle bisherigen App-Fenster geschlossen sind. Das schützt auch andere Tabs. Kein automatischer Neustart und kein Geräte-Sync.",
        )}
      </p>
      <p>
        {tr(
          "Trainingsdaten liegen unverschlüsselt im lokalen Browserprofil. In Einstellungen & Daten ein JSON-Backup exportieren. Daten können bei Browserbereinigung oder Speichermangel verloren gehen.",
        )}
      </p>
      <button
        className="btn"
        onClick={async () => {
          try {
            setStorage(
              (await navigator.storage?.persist?.())
                ? "Best-effort-Persistenz gewährt; kein Backup-Ersatz"
                : "Persistenz nicht gewährt oder nicht unterstützt",
            );
          } catch {
            setStorage("Speicheranfrage nicht verfügbar");
          }
        }}
      >
        {tr("Dauerhafte Speicherung anfragen")}
      </button>
      <p>{tr(storage)}</p>
      <p>
        {tr(
          "Bei Displaysperre und App-Wechsel sind Ton und Hintergrundausführung nicht garantiert. Wiederhergestellte Zeitfenster bestätigen keine ausgeführten Übungen.",
        )}
      </p>
      <label>
        {tr("Technische Diagnose – zum freiwilligen Kopieren")}
        <textarea
          readOnly
          value={`Eúzēn 0.5.0\nBuild: ${build}\nService Worker: ${registration ? "registriert" : "nicht registriert"}\nNetzwerk: ${online ? "online" : "offline"}`}
        />
      </label>
    </details>
  );
}
