import { t as tr } from "../i18n";
import { useState } from "react";
import {
  Plus,
  Search,
  Star,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import {
  dimensions,
  patterns,
  uid,
  exerciseSchema,
  type AppState,
  type Exercise,
} from "../domain/model";
import { Empty, Field, Modal } from "./common";

type Props = {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
};
export function Library({ state, update }: Props) {
  const [search, setSearch] = useState("");
  const [dimension, setDimension] = useState("Alle");
  const [equipment, setEquipment] = useState("Alle");
  const [favorites, setFavorites] = useState(false);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);
  const shown = state.exercises.filter(
    (e) =>
      `${e.name} ${e.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (dimension === "Alle" || e.dimension === dimension) &&
      (equipment === "Alle" || e.equipment === equipment) &&
      (!favorites || e.favorite),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{tr("DEINE BEWEGUNGSBAUSTEINE")}</p>
          <h1>{tr("Die Bibliothek.")}</h1>
          <p>
            {tr("Gute Bewegung beginnt mit einer Übung, die zu dir passt.")}
          </p>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>
          <Plus size={18} />
          {tr("Eigene Übung")}
        </button>
      </div>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label={tr("Übungen suchen")}
            placeholder={tr("Übung oder Bewegungsmuster suchen")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          className={`btn ${favorites ? "selected" : ""}`}
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Star size={17} />
          {tr("Favoriten")}
        </button>
        <label className="filter">
          <SlidersHorizontal size={16} />
          <select
            aria-label={tr("Equipment filtern")}
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            <option value="Alle">{tr("Jedes Equipment")}</option>
            {[...new Set(state.exercises.map((e) => e.equipment))].map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="chips" aria-label={tr("Trainingsdimension")}>
        {["Alle", ...dimensions].map((d) => (
          <button
            key={tr(d)}
            className={`chip ${dimension === d ? "active" : ""}`}
            aria-pressed={dimension === d}
            onClick={() => setDimension(d)}
          >
            {tr(d)}
          </button>
        ))}
      </div>
      <div className="exercise-grid">
        {shown.map((e) => (
          <article className="exercise-card" key={e.id}>
            <div className={`exercise-visual tone-${tr(e.dimension)}`}>
              <span>
                {e.pattern === "Mobilität"
                  ? tr("↝")
                  : e.pattern === "Balance"
                    ? tr("⊥")
                    : e.pattern === "Rotation"
                      ? tr("↻")
                      : e.pattern === "Fortbewegung"
                        ? tr("↗")
                        : tr("∿")}
              </span>
              <button
                className="icon-btn"
                aria-label={`${e.name} ${e.favorite ? tr("aus Favoriten entfernen") : tr("favorisieren")}`}
                aria-pressed={e.favorite}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    exercises: s.exercises.map((x) =>
                      x.id === e.id ? { ...x, favorite: !x.favorite } : x,
                    ),
                  }))
                }
              >
                <Star size={19} fill={e.favorite ? "currentColor" : "none"} />
              </button>
              <small>{e.pattern}</small>
            </div>
            <div className="exercise-body">
              <div className="tagline">
                {e.equipment} <span>·</span> {e.level}
              </div>
              <button
                className="text-button card-link"
                onClick={() => setSelected(e)}
              >
                <h3>{e.name}</h3>
                <ArrowUpRight size={18} />
              </button>
              <p>{e.cue}</p>
              <span className="tag">{tr(e.dimension)}</span>
              {e.custom && <span className="tag">{tr("Eigene Übung")}</span>}
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title={tr("Noch kein Treffer")}
          text={tr(
            "Versuche einen anderen Suchbegriff oder ändere die Filter.",
          )}
        />
      )}
      {selected && (
        <ExerciseDetails
          exercise={selected}
          onClose={() => setSelected(null)}
          onSave={(e) => {
            update((s) => ({
              ...s,
              exercises: s.exercises.map((x) => (x.id === e.id ? e : x)),
            }));
            setSelected(null);
          }}
        />
      )}
      {creating && (
        <ExerciseForm
          onClose={() => setCreating(false)}
          onSave={(e) => {
            update((s) => ({ ...s, exercises: [...s.exercises, e] }));
            setSearch(e.name);
            setDimension("Alle");
            setEquipment("Alle");
            setFavorites(false);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}
function ExerciseDetails({
  exercise: e,
  onClose,
  onSave,
}: {
  exercise: Exercise;
  onClose: () => void;
  onSave: (e: Exercise) => void;
}) {
  const [notes, setNotes] = useState(e.notes);
  return (
    <Modal title={e.name} onClose={onClose}>
      <p className="eyebrow">
        {tr(e.dimension)} · {e.equipment}
      </p>
      <p>{e.description}</p>
      <div className="callout">{e.cue}</div>
      <div className="two-col">
        <div>
          <h4>{tr("Leichter gestalten")}</h4>
          <p>{e.easier || "Intensität individuell reduzieren."}</p>
        </div>
        <div>
          <h4>{tr("Weiterentwickeln")}</h4>
          <p>{e.harder || "Bewegung kontrollierter ausführen."}</p>
        </div>
      </div>
      <Field label={tr("Deine Techniknotizen")}>
        <textarea
          value={notes}
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div className="modal-actions">
        <button className="btn primary" onClick={() => onSave({ ...e, notes })}>
          {tr("Notizen speichern")}
        </button>
      </div>
    </Modal>
  );
}
function ExerciseForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (e: Exercise) => void;
}) {
  const [e, set] = useState<Exercise>({
    id: uid(),
    name: "",
    description: "",
    cue: "",
    pattern: "Squat",
    dimension: "Kraft",
    equipment: "Körpergewicht",
    level: "Einfach",
    metrics: ["reps"],
    easier: "",
    harder: "",
    tags: [],
    notes: "",
    favorite: false,
    custom: true,
  });
  const [error, setError] = useState("");
  return (
    <Modal title={tr("Deine eigene Übung")} onClose={onClose}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          const r = exerciseSchema.safeParse(e);
          if (!r.success)
            return setError(
              "Bitte ergänze Name, Equipment und mindestens eine Messgröße.",
            );
          onSave(r.data);
        }}
      >
        <Field label={tr("Name")}>
          <input
            required
            maxLength={100}
            value={e.name}
            onChange={(v) => set({ ...e, name: v.target.value })}
          />
        </Field>
        <div className="two-col">
          <Field label={tr("Bewegungsmuster")}>
            <select
              value={e.pattern}
              onChange={(v) =>
                set({ ...e, pattern: v.target.value as Exercise["pattern"] })
              }
            >
              {patterns.map((v) => (
                <option key={v} value={v}>
                  {tr(v)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tr("Dimension")}>
            <select
              value={e.dimension}
              onChange={(v) =>
                set({
                  ...e,
                  dimension: v.target.value as Exercise["dimension"],
                })
              }
            >
              {dimensions.map((v) => (
                <option key={v} value={v}>
                  {tr(v)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="two-col">
          <Field label={tr("Equipment")}>
            <input
              required
              maxLength={100}
              value={e.equipment}
              onChange={(v) => set({ ...e, equipment: v.target.value })}
            />
          </Field>
          <Field label={tr("Niveau")}>
            <select
              value={e.level}
              onChange={(v) =>
                set({ ...e, level: v.target.value as Exercise["level"] })
              }
            >
              {["Einfach", "Mittel", "Fortgeschritten"].map((v) => (
                <option key={v} value={v}>
                  {tr(v)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="metric-options">
          <legend>{tr("Messgrößen")}</legend>
          {(
            [
              ["reps", "Wiederholungen"],
              ["time", "Zeit"],
              ["load", "Zusatzlast"],
              ["distance", "Distanz"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={e.metrics.includes(key)}
                onChange={(v) =>
                  set({
                    ...e,
                    metrics: v.target.checked
                      ? [...e.metrics, key]
                      : e.metrics.filter((m) => m !== key),
                  })
                }
              />
              {tr(label)}
            </label>
          ))}
        </fieldset>
        <Field label={tr("Beschreibung")}>
          <textarea
            maxLength={2000}
            value={e.description}
            onChange={(v) => set({ ...e, description: v.target.value })}
          />
        </Field>
        <Field label={tr("Kurzer Technikhinweis")}>
          <input
            maxLength={2000}
            value={e.cue}
            onChange={(v) => set({ ...e, cue: v.target.value })}
          />
        </Field>
        <div className="two-col">
          <Field label={tr("Leichtere Variante")}>
            <input
              value={e.easier}
              maxLength={2000}
              onChange={(v) => set({ ...e, easier: v.target.value })}
            />
          </Field>
          <Field label={tr("Anspruchsvollere Variante")}>
            <input
              value={e.harder}
              maxLength={2000}
              onChange={(v) => set({ ...e, harder: v.target.value })}
            />
          </Field>
        </div>
        <Field label={tr("Tags (durch Komma getrennt)")}>
          <input
            maxLength={1000}
            value={e.tags.join(",")}
            onChange={(v) =>
              set({
                ...e,
                tags: v.target.value
                  .split(",")
                  .slice(0, 20)
                  .map((t) => t.trim().slice(0, 50)),
              })
            }
          />
        </Field>
        {error && (
          <p role="alert" className="error">
            {tr(error)}
          </p>
        )}
        <div className="modal-actions">
          <button className="btn primary" type="submit">
            {tr("Übung speichern")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
