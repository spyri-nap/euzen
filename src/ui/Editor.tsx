import { t as tr } from "../i18n";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  block,
  dimensions,
  modeLabels,
  modes,
  prescription,
  sections,
  templateSchema,
  uid,
  type Exercise,
  type WorkoutBlock,
  type WorkoutTemplate,
} from "../domain/model";
import { Modal, Field, Num } from "./common";

const modeHelp = {
  sets: "Klassische Sätze: erst alle Sätze einer Übung, dann die nächste Übung. Pausen zwischen den Sätzen.",
  rounds:
    "Ein Zirkel: alle Übungen nacheinander, dann Rundenpause. Jeder Satz wird manuell bestätigt.",
  countdown:
    "Ein Countdown je Übung und Durchgang. Nach Ablauf bestätigst du die tatsächliche Leistung.",
  interval:
    "Arbeitszeit je Übung, Übergang zwischen Übungen, Pause nach jeder Runde.",
  emom: "Ein festes Zeitfenster je Übung. Melde deine Reps vor Ablauf; die verbleibende Zeit ist Pause. Der nächste Schritt startet nach Bestätigung.",
  amrap:
    "Eine Übung mit Zeitlimit. Zähle vollständige Runden manuell; eine Runde entspricht den vorgegebenen Reps. Teil-Reps ergänzt du am Ende.",
};
type Props = {
  template?: WorkoutTemplate;
  exercises: Exercise[];
  onClose: () => void;
  onSave: (t: WorkoutTemplate) => void;
};
export function Editor({ template, exercises, onClose, onSave }: Props) {
  const draftKey = `euzen-builder:${template?.id ?? "new"}`;
  const [draftNotice, setDraftNotice] = useState("");
  const [t, set] = useState<WorkoutTemplate>(() =>
    (() => {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const saved = templateSchema.safeParse(JSON.parse(raw));
          if (
            saved.success &&
            saved.data.blocks.every((b) =>
              b.exercises.every((p) =>
                exercises.some((e) => e.id === p.exerciseId),
              ),
            )
          )
            return saved.data;
        }
      } catch {
        /* Invalid drafts never replace templates. */
      }
      return template
        ? structuredClone(template)
        : {
            id: uid(),
            name: "Mein neues Workout",
            description: "",
            dimension: "Kraft",
            blocks: [block(exercises[0].id)],
            sample: false,
            updatedAt: Date.now(),
          };
    })(),
  );
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(t));
      setDraftNotice("Entwurf auf diesem Gerät gesichert.");
    } catch {
      setDraftNotice(
        "Entwurf konnte nicht gesichert werden. Bitte Workout speichern.",
      );
    }
  }, [t, draftKey]);
  const [error, setError] = useState("");
  const updateBlock = (b: WorkoutBlock) =>
    set({ ...t, blocks: t.blocks.map((x) => (x.id === b.id ? b : x)) });
  const moveBlock = (i: number, dir: number) => {
    const blocks = [...t.blocks];
    [blocks[i], blocks[i + dir]] = [blocks[i + dir], blocks[i]];
    set({ ...t, blocks });
  };
  return (
    <Modal
      title={template ? tr("Workout bearbeiten") : tr("Dein Workout gestalten")}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = templateSchema.safeParse(t);
          if (!parsed.success)
            return setError(
              "Prüfe die Werte: mindestens ein Block und eine Übung, positive Reps/Runden/Arbeitszeiten und keine negativen Pausen.",
            );
          if (
            t.blocks.some((b) => b.mode === "amrap" && b.exercises.length !== 1)
          )
            return setError(
              "AMRAP unterstützt eine Übung pro Block. Für Zirkel wähle Runden oder Intervalle.",
            );
          onSave({
            ...parsed.data,
            name: parsed.data.name.trim() || "Mein Workout",
            sample: false,
            updatedAt: Date.now(),
          });
          try {
            localStorage.removeItem(draftKey);
          } catch {
            /* Saved template is authoritative. */
          }
        }}
      >
        <p role="status" className="hint">
          {tr(draftNotice)}
          {tr(
            " Schließen erhält den Entwurf; „Workout speichern“ übernimmt ihn in deine Vorlagen.",
          )}
        </p>
        <div className="two-col">
          <Field label={tr("Workout-Name")}>
            <input
              required
              value={t.name}
              maxLength={100}
              onChange={(e) => set({ ...t, name: e.target.value })}
            />
          </Field>
          <Field label={tr("Fokus")}>
            <select
              value={t.dimension}
              onChange={(e) =>
                set({
                  ...t,
                  dimension: e.target.value as WorkoutTemplate["dimension"],
                })
              }
            >
              {dimensions.map((d) => (
                <option key={d} value={d}>
                  {tr(d)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={tr("Beschreibung / persönliche Hinweise")}>
          <textarea
            maxLength={2000}
            value={t.description}
            onChange={(e) => set({ ...t, description: e.target.value })}
          />
        </Field>
        <div className="builder-blocks">
          {t.blocks.map((b, bi) => (
            <section
              className="builder-block"
              key={b.id}
              aria-label={`Block ${bi + 1}`}
            >
              <div className="block-heading">
                <span className="step-number">
                  {String(bi + 1).padStart(2, "0")}
                </span>
                <input
                  aria-label={`Block ${bi + 1} Name`}
                  required
                  maxLength={100}
                  value={b.name}
                  onChange={(e) => updateBlock({ ...b, name: e.target.value })}
                />
                <div className="button-row">
                  <button
                    className="icon-btn"
                    type="button"
                    disabled={!bi}
                    aria-label={tr("Block nach oben")}
                    onClick={() => moveBlock(bi, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    disabled={bi === t.blocks.length - 1}
                    aria-label={tr("Block nach unten")}
                    onClick={() => moveBlock(bi, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-btn danger"
                    type="button"
                    disabled={t.blocks.length === 1}
                    aria-label={tr("Block entfernen")}
                    onClick={() =>
                      set({
                        ...t,
                        blocks: t.blocks.filter((x) => x.id !== b.id),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="two-col">
                <Field label={tr("Abschnitt")}>
                  <select
                    value={b.section}
                    onChange={(e) =>
                      updateBlock({
                        ...b,
                        section: e.target.value as WorkoutBlock["section"],
                      })
                    }
                  >
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        {tr(s)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("Ausführungsmodus")}>
                  <select
                    value={b.mode}
                    onChange={(e) =>
                      updateBlock({
                        ...b,
                        mode: e.target.value as WorkoutBlock["mode"],
                        work:
                          e.target.value === "emom" && b.mode !== "emom"
                            ? 60
                            : b.work,
                      })
                    }
                  >
                    {modes.map((m) => (
                      <option key={m} value={m}>
                        {tr(modeLabels[m])}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="hint">{modeHelp[b.mode]}</p>
              <Num
                label={tr("Vorbereitung (Sek.)")}
                value={b.prepare}
                max={120}
                onChange={(prepare) => updateBlock({ ...b, prepare })}
              />
              {["emom", "interval", "countdown"].includes(b.mode) && (
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={b.guided}
                    onChange={(e) =>
                      updateBlock({ ...b, guided: e.target.checked })
                    }
                  />
                  {tr("Zeitblock automatisch durchlaufen")}
                </label>
              )}
              {b.guided && (
                <p className="hint">
                  {tr(
                    "Zeitfenster laufen auch ohne Bestätigung weiter. Tatsächliche Leistungen bestätigst du anschließend in der Trainingsgeschichte. Unbestätigte Schritte zählen nicht zur Leistung.",
                  )}
                </p>
              )}
              <div className="number-grid">
                {b.mode !== "amrap" && (
                  <Num
                    label={
                      b.mode === "sets"
                        ? tr("Sätze je Übung")
                        : tr("Durchgänge")
                    }
                    min={1}
                    max={100}
                    value={b.rounds}
                    onChange={(rounds) => updateBlock({ ...b, rounds })}
                  />
                )}
                {!["sets", "rounds"].includes(b.mode) && (
                  <Num
                    label={
                      b.mode === "emom"
                        ? tr("Intervall (Sek.)")
                        : b.mode === "amrap"
                          ? tr("Zeitlimit (Sek.)")
                          : tr("Arbeit (Sek.)")
                    }
                    min={1}
                    max={86400}
                    value={b.work}
                    onChange={(work) => updateBlock({ ...b, work })}
                  />
                )}
                {!["emom", "amrap"].includes(b.mode) && (
                  <Num
                    label={tr("Pause (Sek.)")}
                    max={3600}
                    value={b.rest}
                    onChange={(rest) => updateBlock({ ...b, rest })}
                  />
                )}
              </div>
              {b.exercises.map((p, pi) => {
                const ex = exercises.find((e) => e.id === p.exerciseId)!;
                const edit = (values: Partial<typeof p>) =>
                  updateBlock({
                    ...b,
                    exercises: b.exercises.map((x) =>
                      x.id === p.id ? { ...x, ...values } : x,
                    ),
                  });
                const move = (dir: number) => {
                  const list = [...b.exercises];
                  [list[pi], list[pi + dir]] = [list[pi + dir], list[pi]];
                  updateBlock({ ...b, exercises: list });
                };
                return (
                  <div className="prescription" key={p.id}>
                    <div className="prescription-head">
                      <Field label={`Übung ${pi + 1}`}>
                        <select
                          aria-label={`Übung ${pi + 1} in Block ${bi + 1}`}
                          value={p.exerciseId}
                          onChange={(e) =>
                            edit({
                              exerciseId: e.target.value,
                              load: 0,
                              distance: null,
                            })
                          }
                        >
                          {exercises.map((e) => (
                            <option value={e.id} key={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="button-row">
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={!pi}
                          aria-label={`${ex.name} nach oben`}
                          onClick={() => move(-1)}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          disabled={pi === b.exercises.length - 1}
                          aria-label={`${ex.name} nach unten`}
                          onClick={() => move(1)}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          disabled={b.exercises.length === 1}
                          aria-label={`${ex.name} entfernen`}
                          onClick={() =>
                            updateBlock({
                              ...b,
                              exercises: b.exercises.filter(
                                (x) => x.id !== p.id,
                              ),
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="number-grid">
                      {(ex.metrics.includes("reps") || b.mode === "amrap") && (
                        <Num
                          label={
                            b.mode === "amrap"
                              ? tr("Reps je Runde")
                              : tr("Reps")
                          }
                          min={1}
                          value={p.reps}
                          onChange={(reps) => edit({ reps })}
                        />
                      )}
                      {ex.metrics.includes("load") && (
                        <>
                          <Num
                            label={tr("kg je Gewicht")}
                            value={p.load}
                            step={0.5}
                            onChange={(load) => edit({ load })}
                          />
                          <Field label={tr("Gewichte")}>
                            <select
                              value={p.implements}
                              onChange={(e) =>
                                edit({
                                  implements: Number(e.target.value) as 1 | 2,
                                })
                              }
                            >
                              <option value={1}>{tr("1 Gewicht")}</option>
                              <option value={2}>{tr("2 Gewichte")}</option>
                            </select>
                          </Field>
                        </>
                      )}
                      {ex.metrics.includes("distance") && (
                        <Field label={tr("Distanz (m, optional)")}>
                          <input
                            type="number"
                            min={0}
                            max={1000000}
                            value={p.distance ?? ""}
                            onChange={(e) =>
                              edit({
                                distance:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                      )}
                    </div>
                    {["sets", "rounds"].includes(b.mode) && (
                      <details>
                        <summary>
                          {tr("Individuelle Vorgaben je Satz / Runde")}
                        </summary>
                        {Array.from(
                          { length: Math.min(b.rounds, 100) },
                          (_, i) => {
                            const target = b.setTargets.find(
                              (t) =>
                                t.prescriptionId === p.id && t.round === i + 1,
                            );
                            const editTarget = (values: {
                              reps?: number;
                              load?: number;
                            }) =>
                              updateBlock({
                                ...b,
                                setTargets: [
                                  ...b.setTargets.filter(
                                    (t) =>
                                      !(
                                        t.prescriptionId === p.id &&
                                        t.round === i + 1
                                      ),
                                  ),
                                  {
                                    prescriptionId: p.id,
                                    round: i + 1,
                                    reps: target?.reps ?? p.reps,
                                    load: target?.load ?? p.load,
                                    ...values,
                                  },
                                ],
                              });
                            return (
                              <div className="two-col" key={i}>
                                <Num
                                  label={`Satz ${i + 1} · Reps`}
                                  min={1}
                                  value={target?.reps ?? p.reps}
                                  onChange={(reps) => editTarget({ reps })}
                                />
                                <Num
                                  label={`Satz ${i + 1} · kg je Gewicht`}
                                  step={0.5}
                                  value={target?.load ?? p.load}
                                  onChange={(load) => editTarget({ load })}
                                />
                              </div>
                            );
                          },
                        )}
                      </details>
                    )}
                    <details>
                      <summary>{tr("Seite, Tempo & weitere Vorgaben")}</summary>
                      <div className="number-grid">
                        <Field label={tr("Seite")}>
                          <select
                            value={tr(p.side)}
                            onChange={(e) =>
                              edit({ side: e.target.value as typeof p.side })
                            }
                          >
                            {["Beidseitig", "Links", "Rechts"].map((s) => (
                              <option key={s} value={s}>
                                {tr(s)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={tr("Tempo (z. B. 3–1–1)")}>
                          <input
                            maxLength={50}
                            value={p.tempo}
                            onChange={(e) => edit({ tempo: e.target.value })}
                          />
                        </Field>
                        {(["rpe", "rir"] as const).map((key) => (
                          <Field
                            key={key}
                            label={`Ziel-${key.toUpperCase()} (optional)`}
                          >
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={p[key] ?? ""}
                              onChange={(e) =>
                                edit({
                                  [key]:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                })
                              }
                            />
                          </Field>
                        ))}
                      </div>
                      <Field label={tr("Techniknotiz")}>
                        <input
                          value={p.notes}
                          maxLength={2000}
                          onChange={(e) => edit({ notes: e.target.value })}
                        />
                      </Field>
                    </details>
                  </div>
                );
              })}
              <button
                type="button"
                className="btn subtle"
                disabled={b.mode === "amrap" || b.exercises.length >= 20}
                onClick={() =>
                  updateBlock({
                    ...b,
                    exercises: [...b.exercises, prescription(exercises[0].id)],
                  })
                }
              >
                <Plus size={16} />
                {tr("Übung hinzufügen")}
              </button>
              {b.exercises.length > 1 &&
                !["emom", "amrap"].includes(b.mode) && (
                  <Num
                    label={tr("Übergang zwischen Übungen (Sek.)")}
                    value={b.transition}
                    max={600}
                    onChange={(transition) => updateBlock({ ...b, transition })}
                  />
                )}
            </section>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          disabled={t.blocks.length >= 20}
          onClick={() =>
            set({ ...t, blocks: [...t.blocks, block(exercises[0].id)] })
          }
        >
          <Plus size={17} />
          {tr("Block hinzufügen")}
        </button>
        {error && (
          <p className="error" role="alert">
            {tr(error)}
          </p>
        )}
        <div className="modal-actions sticky-actions">
          <button type="button" className="btn" onClick={onClose}>
            {tr("Schließen · Entwurf behalten")}
          </button>
          <button type="submit" className="btn primary">
            {tr("Workout speichern")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
