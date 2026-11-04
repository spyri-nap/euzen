import { t as tr } from "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="boot">
          <h1>{tr("Ein kurzer Zwischenstopp.")}</h1>
          <p>
            {tr(
              "Die Ansicht konnte nicht geladen werden. Bereits gespeicherte Daten bleiben erhalten.",
            )}
          </p>
          <button onClick={() => location.reload()}>
            {tr("Erneut öffnen")}
          </button>
        </main>
      );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
