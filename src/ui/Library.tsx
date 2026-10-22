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
          <p className="eyebrow">DEINE BEWEGUNGSBAUSTEINE</p>
          <h1>Die Bibliothek.</h1>
          <p>Gute Bewegung beginnt mit einer Übung, die zu dir passt.</p>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>
          <Plus size={18} />
          Eigene Übung
        </button>
      </div>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Übungen suchen"
            placeholder="Übung oder Bewegungsmuster suchen"
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
          Favoriten
        </button>
        <label className="filter">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Equipment filtern"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            <option value="Alle">Jedes Equipment</option>
            {[...new Set(state.exercises.map((e) => e.equipment))].map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="chips" aria-label="Trainingsdimension">
        {["Alle", ...dimensions].map((d) => (
          <button
            key={d}
            className={`chip ${dimension === d ? "active" : ""}`}
            aria-pressed={dimension === d}
            onClick={() => setDimension(d)}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="exercise-grid">
        {shown.map((e) => (
          <article className="exercise-card" key={e.id}>
            <div className={`exercise-visual tone-${e.dimension}`}>
              <span>
                {e.pattern === "Mobilität"
                  ? "↝"
                  : e.pattern === "Balance"
                    ? "⊥"
                    : e.pattern === "Rotation"
                      ? "↻"
                      : e.pattern === "Fortbewegung"
                        ? "↗"
                        : "∿"}
              </span>
              <button
                className="icon-btn"
                aria-label={`${e.name} ${e.favorite ? "aus Favoriten entfernen" : "favorisieren"}`}
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
              <span className="tag">{e.dimension}</span>
              {e.custom && <span className="tag">Eigene Übung</span>}
            </div>
          </article>
        ))}
      </div>
      {!shown.length && (
        <Empty
          title="Noch kein Treffer"
          text="Versuche einen anderen Suchbegriff oder ändere die Filter."
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
        {e.dimension} · {e.equipment}
      </p>
      <p>{e.description}</p>
      <div className="callout">{e.cue}</div>
      <div className="two-col">
        <div>
          <h4>Leichter gestalten</h4>
          <p>{e.easier || "Intensität individuell reduzieren."}</p>
        </div>
        <div>
          <h4>Weiterentwickeln</h4>
          <p>{e.harder || "Bewegung kontrollierter ausführen."}</p>
        </div>
      </div>
      <Field label="Deine Techniknotizen">
        <textarea
          value={notes}
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div className="modal-actions">
        <button className="btn primary" onClick={() => onSave({ ...e, notes })}>
          Notizen speichern
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
    <Modal title="Deine eigene Übung" onClose={onClose}>
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
        <Field label="Name">
          <input
            required
            maxLength={100}
            value={e.name}
            onChange={(v) => set({ ...e, name: v.target.value })}
          />
        </Field>
        <div className="two-col">
          <Field label="Bewegungsmuster">
            <select
              value={e.pattern}
              onChange={(v) =>
                set({ ...e, pattern: v.target.value as Exercise["pattern"] })
              }
            >
              {patterns.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Dimension">
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
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="two-col">
          <Field label="Equipment">
            <input
              required
              maxLength={100}
              value={e.equipment}
              onChange={(v) => set({ ...e, equipment: v.target.value })}
            />
          </Field>
          <Field label="Niveau">
            <select
              value={e.level}
              onChange={(v) =>
                set({ ...e, level: v.target.value as Exercise["level"] })
              }
            >
              {["Einfach", "Mittel", "Fortgeschritten"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <fieldset className="metric-options">
          <legend>Messgrößen</legend>
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
              {label}
            </label>
          ))}
        </fieldset>
        <Field label="Beschreibung">
          <textarea
            maxLength={2000}
            value={e.description}
            onChange={(v) => set({ ...e, description: v.target.value })}
          />
        </Field>
        <Field label="Kurzer Technikhinweis">
          <input
            maxLength={2000}
            value={e.cue}
            onChange={(v) => set({ ...e, cue: v.target.value })}
          />
        </Field>
        <div className="two-col">
          <Field label="Leichtere Variante">
            <input
              value={e.easier}
              maxLength={2000}
              onChange={(v) => set({ ...e, easier: v.target.value })}
            />
          </Field>
          <Field label="Anspruchsvollere Variante">
            <input
              value={e.harder}
              maxLength={2000}
              onChange={(v) => set({ ...e, harder: v.target.value })}
            />
          </Field>
        </div>
        <Field label="Tags (durch Komma getrennt)">
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
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="btn primary" type="submit">
            Übung speichern
          </button>
        </div>
      </form>
    </Modal>
  );
}
