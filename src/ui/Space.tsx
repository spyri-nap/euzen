import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CircleCheck,
  Link2,
  MessageCircle,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { coachContext } from "../domain/analytics";
import { type AppState } from "../domain/model";
import { Field, MovementArt } from "./common";

export function Space({
  state,
  onPlan,
}: {
  state: AppState;
  onPlan: () => void;
}) {
  const context = coachContext(state);
  const [reflection, setReflection] = useState("");
  const [answer, setAnswer] = useState(false);
  const total = context.complete + context.incomplete;
  const missing = ["Pull", "Balance", "Fortbewegung"].filter(
    (p) => !context.patterns[p],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WISSEN, DAS DICH WEITERBRINGT</p>
          <h1>Dein Eúzēn Space.</h1>
          <p>Zusammenhänge verstehen. Bewusst in Bewegung bleiben.</p>
        </div>
        <span className="pill">
          <Sparkles size={14} />
          Wissen & Reflexion
        </span>
      </div>
      <section className="space-hero">
        <div>
          <p className="eyebrow">EIN GUTES LEBEN IN BEWEGUNG</p>
          <h2>
            Neugierig bleiben.
            <br />
            Auf dich hören.
          </h2>
          <p>
            Deine Trainingsgeschichte ist der Ausgangspunkt für deine nächste
            bewusste Entscheidung.
          </p>
        </div>
        <MovementArt small />
      </section>
      <div className="two-col section-gap">
        <section className="panel">
          <div className="section-head">
            <h2>Ein Blick auf deinen Rhythmus</h2>
            <CircleCheck size={22} />
          </div>
          <span className="tag">Regelbasierte Auswertung · keine Live-KI</span>
          <p>
            {total
              ? `${context.complete} abgeschlossene und ${context.incomplete} unvollständige Einheiten sind gespeichert.`
              : "Du hast noch keine Trainingsergebnisse gespeichert. Nach deiner ersten Einheit beginnt die persönliche Reflexion."}
          </p>
          {total > 0 && (
            <p>
              {missing.length
                ? `Für ${missing.join(", ")} sind bisher keine Arbeitsschritte protokolliert. Prüfe, ob diese Bewegungen zu deinem Wochenziel passen.`
                : "Pull, Balance und Fortbewegung kommen in deinen gespeicherten Arbeitsschritten vor."}
            </p>
          )}
          <p className="hint">
            Daten: {context.source}. Zeitraum: {context.period}. Außerhalb der
            App absolvierte Bewegung ist unbekannt.
          </p>
          <button className="btn" onClick={onPlan}>
            Wochenplan ansehen
            <ArrowUpRight size={16} />
          </button>
          <details>
            <summary>Verwendete Trainingszusammenfassung</summary>
            <pre>{JSON.stringify(context, null, 2)}</pre>
          </details>
        </section>
        <section className="panel">
          <p className="eyebrow">PERSÖNLICHE REFLEXION</p>
          <h2>Was möchtest du verstehen?</h2>
          <p>
            Wähle eine Frage für eine nachvollziehbare Auswertung deiner
            gespeicherten Daten.
          </p>
          <Field label="Meine Frage">
            <select
              value={reflection}
              onChange={(e) => {
                setReflection(e.target.value);
                setAnswer(false);
              }}
            >
              <option value="">Frage auswählen</option>
              <option value="balance">Wie ausgewogen ist mein Training?</option>
              <option value="consistency">
                Wie regelmäßig bewege ich mich?
              </option>
            </select>
          </Field>
          <button
            className="btn primary"
            disabled={!reflection}
            onClick={() => setAnswer(true)}
          >
            Auswertung zeigen
            <ArrowUpRight size={16} />
          </button>
          {answer && (
            <div className="callout" role="status">
              {!total
                ? "Für diese Frage fehlen noch Trainingsdaten."
                : reflection === "balance"
                  ? `Deine protokollierten Arbeitsschritte verteilen sich auf ${Object.keys(context.dimensions).length} Trainingsdimensionen. ${missing.length ? `Bisher nicht erfasst: ${missing.join(", ")}.` : "Die beobachteten Grundmuster sind vertreten."} Das beschreibt die Erfassung, nicht die Qualität deiner gesamten Bewegung.`
                  : `An ${context.days} unterschiedlichen Tagen hast du Arbeitsschritte protokolliert. Für eine persönliche Entwicklung ist ein Vergleich über mehrere Wochen sinnvoll.`}
            </div>
          )}
          <div className="connection-note">
            <MessageCircle size={18} />
            <span>
              Freier KI-Chat ist vorbereitet. Es ist noch kein KI-Dienst
              verbunden.
            </span>
          </div>
        </section>
      </div>
      <div className="section-head section-gap">
        <h2>Impulse für ein gutes Leben</h2>
        <span className="muted">Kuratierte Grundlagen</span>
      </div>
      <div className="guide-grid">
        <a
          className="guide-card"
          href="https://www.who.int/publications/i/item/9789240015128"
          target="_blank"
          rel="noreferrer"
        >
          <BookOpen size={23} />
          <h3>Bewegung vielseitig denken</h3>
          <p>
            Kraft und Ausdauer als Grundpfeiler; bei älteren Erwachsenen auch
            funktionelle Balance berücksichtigen.
          </p>
          <small>
            WHO · Leitlinie 2020
            <br />
            Quelle geprüft: 22.10.2026
          </small>
          <ArrowUpRight size={18} />
        </a>
        <a
          className="guide-card"
          href="https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-older-adults/"
          target="_blank"
          rel="noreferrer"
        >
          <BookOpen size={23} />
          <h3>Ein Rhythmus für den Alltag</h3>
          <p>
            Regelmäßige Aktivität, Kraft, Balance und Beweglichkeit im Alltag
            verankern.
          </p>
          <small>
            NHS · Allgemeine Orientierung
            <br />
            Quelle geprüft: 22.10.2026
          </small>
          <ArrowUpRight size={18} />
        </a>
        <div className="guide-card subdued">
          <Newspaper size={23} />
          <h3>Weniger Rauschen. Mehr Wissen.</h3>
          <p>
            Hier ist Platz für geprüfte Longevity-News mit Originalquelle und
            Veröffentlichungsdatum.
          </p>
          <span className="tag">Noch kein Newsfeed verbunden</span>
        </div>
      </div>
      <section className="panel section-gap">
        <div className="section-head">
          <div>
            <p className="eyebrow">DEINE VERBINDUNGEN</p>
            <h2>Mehr Kontext. Bewusst geteilt.</h2>
          </div>
          <Link2 size={24} />
        </div>
        <div className="connector-grid">
          {[
            [
              "KI-Dienst",
              "Schreibgeschützter Kontext vorbereitet. Verbindung und Datenfreigabe folgen.",
            ],
            [
              "Apple Health",
              "Für eine spätere native iOS-Erweiterung vorgesehen.",
            ],
            [
              "Android Health",
              "Für eine spätere native Android-Erweiterung vorgesehen.",
            ],
          ].map(([name, description]) => (
            <div key={name}>
              <h4>{name}</h4>
              <p>{description}</p>
              <span className="tag">Nicht verbunden</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
