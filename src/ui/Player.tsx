import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Pause,
  Play,
  Plus,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  clock,
  draftSchema,
  formatDate,
  modeLabels,
  number,
  resultSchema,
  uid,
  type AppState,
  type SetResult,
  type WorkoutSession,
} from "../domain/model";
import {
  activeDuration,
  elapsed,
  extend,
  finish,
  freshTimer,
  pause,
  settle,
  start,
} from "../domain/timer";
import { previousResult } from "../domain/analytics";
import { Field, Modal, Num } from "./common";
import { useWakeLock } from "./useWakeLock";

export function Player({
  state,
  session: s,
  update,
  onExit,
}: {
  state: AppState;
  session: WorkoutSession;
  update: (fn: (s: AppState) => AppState) => void;
  onExit: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const wake = useWakeLock();
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<WorkoutSession | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const phase = s.phases[s.phaseIndex];
  const b = s.snapshot.blocks.find((b) => b.id === phase.blockId)!;
  const p = b.exercises.find((p) => p.id === phase.prescriptionId)!;
  const e = s.exercises.find((e) => e.id === phase.exerciseId)!;
  const existing = s.results.find((r) => r.stepId === phase.id);
  const draft = s.draft ?? {
    reps: e.metrics.includes("reps") ? p.reps : 0,
    load: p.load,
    distance: p.distance,
    rpe: null,
    rir: null,
    notes: "",
    rounds: 0,
    partial: 0,
  };
  const work = phase.kind === "work";
  const timed = !phase.manual;
  const ms = elapsed(s.timer, now);
  const targetDuration = phase.duration + s.timer.extensionMs / 1000;
  const remaining = Math.max(0, targetDuration - ms / 1000);
  const previous = previousResult(state, s, e.id, p.id, b.id, phase.round);
  const patch = (fn: (s: WorkoutSession) => WorkoutSession) =>
    update((state) => ({
      ...state,
      sessions: state.sessions.map((x) =>
        x.id === s.id && x.status === "active" ? fn(x) : x,
      ),
    }));
  const editDraft = (values: Partial<typeof draft>) =>
    patch((current) => ({
      ...current,
      draft: { ...(current.draft ?? draft), ...values },
    }));
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (s.timer.status !== "running" || !timed || remaining > 0) return;
    const expiry =
      (s.timer.startedAt ?? now) +
      Math.max(0, targetDuration * 1000 - s.timer.elapsedMs);
    patch((current) => ({
      ...current,
      timer: settle(current.timer, phase.duration, false, now),
      activeMs: activeDuration(current, expiry),
      activeSince: null,
      ...(phase.kind !== "work" &&
      current.phaseIndex < current.phases.length - 1
        ? {
            phaseIndex: current.phaseIndex + 1,
            timer: start(freshTimer(), now),
            activeSince: now,
            draft: null,
          }
        : {}),
    }));
    if (state.preferences.audio && audioRef.current) {
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.frequency.value = 660;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
    // The state machine performs one terminal transition per running phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, s.timer.status, phase.id]);
  const enableAudio = () => {
    const enabled = !state.preferences.audio;
    if (enabled) {
      try {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume();
      } catch {
        setError("Audio ist in diesem Browser nicht verfügbar.");
      }
    }
    update((state) => ({
      ...state,
      preferences: { ...state.preferences, audio: enabled },
    }));
  };
  const toggle = () => {
    const stamp = Date.now();
    if (state.preferences.audio) {
      try {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume();
      } catch {
        /* Visual timer remains available. */
      }
    }
    patch((current) =>
      current.timer.status === "running"
        ? {
            ...current,
            timer: pause(current.timer, stamp),
            activeMs: activeDuration(current, stamp),
            activeSince: null,
          }
        : {
            ...current,
            timer: start(current.timer, stamp),
            activeSince: current.timer.status === "expired" ? null : stamp,
          },
    );
  };
  const next = (skip = false) => {
    if (!skip && work && s.timer.status === "idle") {
      setError("Starte die Übung, bevor du sie bestätigst.");
      return;
    }
    if (
      !skip &&
      work &&
      timed &&
      s.timer.status !== "expired" &&
      b.mode !== "emom"
    ) {
      setError("Lass den Timer auslaufen oder überspringe diesen Schritt.");
      return;
    }
    if (!skip && work && b.mode === "emom" && s.timer.status !== "expired") {
      setError(
        "Das Intervall läuft noch. Du kannst deine Reps jetzt vormerken.",
      );
      return;
    }
    const stamp = Date.now();
    const check = draftSchema.safeParse(draft);
    if (
      !check.success ||
      (b.mode === "amrap" &&
        (draft.partial >= p.reps ||
          draft.rounds * p.reps + draft.partial > 100000))
    ) {
      setError(
        "Bitte prüfe deine Eingaben: ganze Reps/Runden, gültige Last und RPE/RIR zwischen 0 und 10. Eine Teilrunde enthält weniger als die vorgegebenen Reps.",
      );
      return;
    }
    const parsed = check.data;
    setError("");
    setUndo(
      structuredClone({
        ...s,
        timer: pause(s.timer, stamp),
        activeMs: activeDuration(s, stamp),
        activeSince: null,
      }),
    );
    patch((current) => {
      if (current.phaseIndex !== s.phaseIndex) return current;
      const result: SetResult = {
        id: existing?.id ?? uid(),
        stepId: phase.id,
        blockId: b.id,
        prescriptionId: p.id,
        exerciseId: e.id,
        round: phase.round,
        reps:
          b.mode === "amrap"
            ? parsed.rounds * p.reps + parsed.partial
            : parsed.reps,
        load: parsed.load,
        implements: p.implements,
        seconds: Math.min(
          86400,
          Math.round(elapsed(current.timer, stamp) / 1000),
        ),
        distance: parsed.distance,
        rir: parsed.rir,
        rpe: parsed.rpe,
        notes: parsed.notes,
        roundsCompleted: b.mode === "amrap" ? parsed.rounds : 1,
        skipped: skip,
        recordedAt: stamp,
      };
      const results = work
        ? [
            ...current.results.filter((r) => r.stepId !== phase.id),
            resultSchema.parse(result),
          ]
        : current.results;
      const updated = {
        ...current,
        results,
        draft: null,
        activeMs: activeDuration(current, stamp),
        activeSince: null,
        timer: freshTimer(),
      };
      if (current.phaseIndex === current.phases.length - 1)
        return finish(updated, !results.some((r) => r.skipped), stamp);
      return {
        ...updated,
        phaseIndex: current.phaseIndex + 1,
        timer: start(freshTimer(), stamp),
        activeSince: stamp,
      };
    });
  };
  const nextPhase = s.phases[s.phaseIndex + 1];
  const done = s.results.filter((r) => !r.skipped).length;
  return (
    <div className="player">
      <div className="player-top">
        <button className="btn subtle" onClick={onExit}>
          <ChevronLeft size={18} />
          Zur Übersicht
        </button>
        <span>{s.snapshot.name}</span>
        <button
          className="icon-btn"
          aria-label={
            state.preferences.audio ? "Ton ausschalten" : "Ton einschalten"
          }
          onClick={enableAudio}
        >
          {state.preferences.audio ? (
            <Volume2 size={20} />
          ) : (
            <VolumeX size={20} />
          )}
        </button>
      </div>
      <div
        className="session-progress"
        aria-label={`Schritt ${s.phaseIndex + 1} von ${s.phases.length}`}
      >
        <div style={{ width: `${(s.phaseIndex / s.phases.length) * 100}%` }} />
      </div>
      <div className="button-row">
        <button
          className="btn small-btn"
          disabled={!wake.supported}
          aria-pressed={wake.enabled}
          onClick={wake.toggle}
        >
          {wake.active
            ? "Bildschirm bleibt wach"
            : wake.enabled
              ? "Wachhalten angefragt"
              : "Bildschirm wach halten"}
        </button>
        <span className="hint">
          {wake.message ||
            (!wake.supported ? "In diesem Browser nicht verfügbar." : "")}
        </span>
      </div>
      <div className="player-layout">
        <section className="player-main">
          <p className="eyebrow">
            {b.section} · {modeLabels[b.mode]} · {b.name}
          </p>
          <h1>
            {work
              ? e.name
              : phase.kind === "rest"
                ? "Zeit zum Durchatmen."
                : "In Ruhe wechseln."}
          </h1>
          <p className="player-cue">
            {work
              ? e.cue
              : "Lockere dich, atme ruhig und bereite dich auf die nächste Bewegung vor."}
          </p>
          <div className="timer-display">
            <span className="timer-meta">
              {work
                ? `Durchgang ${phase.round} / ${b.mode === "amrap" ? "1 Zeitfenster" : b.rounds}`
                : "Erholung"}{" "}
              · Schritt {s.phaseIndex + 1}/{s.phases.length}
            </span>
            <div
              className={`timer-ring ${s.timer.status === "running" ? "running" : ""}`}
              style={
                {
                  "--progress": timed
                    ? `${(1 - remaining / targetDuration) * 100}%`
                    : "0%",
                } as React.CSSProperties
              }
            >
              <span>{clock(Math.ceil(timed ? remaining : ms / 1000))}</span>
              <small>
                {s.timer.status === "expired"
                  ? "Zeit geschafft"
                  : s.timer.status === "paused"
                    ? "Pausiert"
                    : timed
                      ? "Verbleibend"
                      : "Deine Zeit"}
              </small>
            </div>
            <div className="timer-controls">
              <button
                className="btn primary"
                disabled={s.timer.status === "expired"}
                onClick={toggle}
              >
                {s.timer.status === "running" ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}{" "}
                {s.timer.status === "running"
                  ? "Pause"
                  : s.timer.status === "paused"
                    ? "Fortsetzen"
                    : "Starten"}
              </button>
              <button
                className="btn"
                onClick={() =>
                  patch((current) => ({
                    ...current,
                    timer: extend(current.timer, 30, Date.now()),
                    activeMs: activeDuration(current, Date.now()),
                    activeSince: null,
                  }))
                }
                disabled={!timed || s.timer.status === "idle"}
              >
                <Plus size={16} />
                30 s Zeit
              </button>
            </div>
          </div>
          {work && (
            <div className="target-bar">
              <span>Vorgabe</span>
              <strong>
                {e.metrics.includes("reps")
                  ? `${p.reps} Reps`
                  : `${b.work} Sekunden`}
                {p.load > 0 ? ` · ${p.implements} × ${p.load} kg` : ""}
                {p.distance !== null ? ` · ${p.distance} m` : ""}
              </strong>
              <small>
                {p.side}
                {p.tempo ? ` · Tempo ${p.tempo}` : ""}
                {p.rpe !== null ? ` · RPE ${p.rpe}` : ""}
                {p.rir !== null ? ` · RIR ${p.rir}` : ""}
              </small>
            </div>
          )}
          {p.notes && work && <p className="callout">{p.notes}</p>}
          <p className="hint">
            Der nächste Schritt startet nach deiner Bestätigung.
            Hintergrundsignale hängen vom Browser ab.
          </p>
        </section>
        <aside className="player-log">
          <p className="eyebrow">{work ? "DEIN PROTOKOLL" : "ALS NÄCHSTES"}</p>
          {work ? (
            <>
              <h2>Wie lief es?</h2>
              <p>Trage ein, was du tatsächlich geschafft hast.</p>
              {b.mode === "amrap" ? (
                <>
                  <div className="round-counter">
                    <button
                      className="btn"
                      aria-label="Eine Runde weniger"
                      disabled={draft.rounds === 0}
                      onClick={() => editDraft({ rounds: draft.rounds - 1 })}
                    >
                      −
                    </button>
                    <div>
                      <strong>{draft.rounds}</strong>
                      <span>volle Runden</span>
                    </div>
                    <button
                      className="btn"
                      aria-label="Eine Runde mehr"
                      onClick={() => editDraft({ rounds: draft.rounds + 1 })}
                    >
                      +
                    </button>
                  </div>
                  <Num
                    label="Zusätzliche Reps (Teilrunde)"
                    value={draft.partial}
                    max={100000}
                    onChange={(partial) => editDraft({ partial })}
                  />
                  <p className="hint">
                    1 Runde = {p.reps} Reps. Gesamt:{" "}
                    {draft.rounds * p.reps + draft.partial} Reps.
                  </p>
                </>
              ) : (
                e.metrics.includes("reps") && (
                  <Num
                    label="Tatsächliche Wiederholungen"
                    value={draft.reps}
                    max={100000}
                    onChange={(reps) => editDraft({ reps })}
                  />
                )
              )}
              {e.metrics.includes("load") && (
                <Num
                  label={`kg je Gewicht (${p.implements} Gewicht${p.implements === 2 ? "e" : ""})`}
                  step={0.5}
                  value={draft.load}
                  onChange={(load) => editDraft({ load })}
                />
              )}
              {e.metrics.includes("distance") && (
                <Field label="Tatsächliche Distanz (m)">
                  <input
                    type="number"
                    min={0}
                    value={draft.distance ?? ""}
                    onChange={(e) =>
                      editDraft({
                        distance:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
              )}
              <div className="two-col">
                {(["rpe", "rir"] as const).map((key) => (
                  <Field key={key} label={`${key.toUpperCase()} (optional)`}>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={draft[key] ?? ""}
                      onChange={(e) =>
                        editDraft({
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
              <p className="hint">
                RPE: empfundene Anstrengung (0–10). RIR: geschätzte zusätzliche
                Wiederholungen.
              </p>
              <Field label="Notiz">
                <textarea
                  maxLength={2000}
                  value={draft.notes}
                  onChange={(e) => editDraft({ notes: e.target.value })}
                />
              </Field>
              {previous ? (
                <div className="previous">
                  <small>
                    Letztes vergleichbares Training ·{" "}
                    {formatDate(previous.date)}
                  </small>
                  <strong>
                    {previous.result.reps} Reps
                    {previous.result.load
                      ? ` · ${number(previous.result.load, 1)} kg`
                      : ""}
                    {previous.result.rpe !== null
                      ? ` · RPE ${previous.result.rpe}`
                      : ""}
                  </strong>
                </div>
              ) : (
                <p className="hint">
                  Dein erster Referenzpunkt für dieses Protokoll.
                </p>
              )}
              {b.mode === "emom" && s.timer.status === "running" && (
                <p className="callout">
                  Reps eingetragen? Nutze die Restzeit als Pause. Bestätige nach
                  Ablauf des Intervalls.
                </p>
              )}
            </>
          ) : (
            <>
              <h2>
                {nextPhase
                  ? s.exercises.find((e) => e.id === nextPhase.exerciseId)?.name
                  : "Geschafft"}
              </h2>
              <p>{done} Arbeitsschritte protokolliert.</p>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {undo && (
            <button
              className="btn full"
              onClick={() => {
                patch(() => undo);
                setUndo(null);
              }}
            >
              Letzten Schritt rückgängig machen
            </button>
          )}
          <button
            className="btn primary full"
            onClick={() => next()}
            disabled={
              s.timer.status === "idle" ||
              (timed && s.timer.status !== "expired")
            }
          >
            {s.phaseIndex === s.phases.length - 1 ? (
              <Check size={18} />
            ) : (
              <ArrowRight size={18} />
            )}{" "}
            {s.phaseIndex === s.phases.length - 1
              ? "Workout speichern"
              : work
                ? "Bestätigen & weiter"
                : "Weiter"}
          </button>
          <button className="btn subtle full" onClick={() => next(true)}>
            <SkipForward size={16} />
            Schritt überspringen
          </button>
          <button
            className="text-button muted full"
            onClick={() => setEnding(true)}
          >
            Training vorzeitig beenden
          </button>
        </aside>
      </div>
      {ending && (
        <Modal
          title="Training für heute beenden?"
          onClose={() => setEnding(false)}
        >
          <p>
            Deine bisherigen Ergebnisse bleiben erhalten. Die Einheit wird als
            unvollständig gespeichert.
          </p>
          <Field label="Notiz zur Einheit">
            <textarea
              value={s.notes}
              maxLength={2000}
              onChange={(e) =>
                patch((current) => ({ ...current, notes: e.target.value }))
              }
            />
          </Field>
          <div className="modal-actions">
            <button className="btn" onClick={() => setEnding(false)}>
              Weitertrainieren
            </button>
            <button
              className="btn primary"
              onClick={() => {
                patch((current) => finish(current, false, Date.now()));
                setEnding(false);
              }}
            >
              Ergebnisse speichern
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
