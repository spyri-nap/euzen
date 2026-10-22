import { z } from "zod";

export const dimensions = [
  "Kraft",
  "Ausdauer",
  "Mobilität",
  "Balance",
  "Regeneration",
] as const;
export const patterns = [
  "Squat",
  "Hinge",
  "Push",
  "Pull",
  "Carry",
  "Rumpf",
  "Rotation",
  "Fortbewegung",
  "Balance",
  "Mobilität",
] as const;
export const modes = [
  "sets",
  "countdown",
  "interval",
  "rounds",
  "emom",
  "amrap",
] as const;
export const modeLabels: Record<Mode, string> = {
  sets: "Sätze & Reps",
  countdown: "Countdown",
  interval: "Intervalle",
  rounds: "Runden",
  emom: "EMOM",
  amrap: "AMRAP",
};
export const sections = ["Warm-up", "Hauptteil", "Cool-down"] as const;
const id = z.string().min(1).max(100);
const text = z.string().max(2000);
const posInt = z.number().int().min(1).max(1000);
const seconds = z.number().int().min(0).max(86400);
const effort = z.number().min(0).max(10).nullable();
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T12:00:00`);
    return !isNaN(d.getTime()) && localDate(d) === v;
  }, "Ungültiges Kalenderdatum");
const timestamp = z.number().finite().min(0);

export const exerciseSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  description: text,
  cue: text,
  pattern: z.enum(patterns),
  dimension: z.enum(dimensions),
  equipment: z.string().min(1).max(100),
  level: z.enum(["Einfach", "Mittel", "Fortgeschritten"]),
  metrics: z.array(z.enum(["reps", "time", "load", "distance"])).min(1),
  easier: text,
  harder: text,
  tags: z.array(z.string().max(50)).max(20),
  notes: text,
  favorite: z.boolean(),
  custom: z.boolean(),
});
export const prescriptionSchema = z.object({
  id,
  exerciseId: id,
  reps: posInt,
  load: z.number().min(0).max(1000),
  implements: z.union([z.literal(1), z.literal(2)]),
  side: z.enum(["Beidseitig", "Links", "Rechts"]),
  tempo: z.string().max(50),
  rir: effort,
  rpe: effort,
  distance: z.number().min(0).max(1000000).nullable(),
  notes: text,
});
export const blockSchema = z.object({
  id,
  section: z.enum(sections),
  name: z.string().min(1).max(100),
  mode: z.enum(modes),
  rounds: posInt,
  work: seconds.refine((n) => n >= 1),
  rest: seconds,
  transition: seconds,
  guided: z.boolean().default(false),
  prepare: seconds.default(0),
  setTargets: z
    .array(
      z.object({
        prescriptionId: id,
        round: posInt,
        reps: posInt,
        load: z.number().min(0).max(1000),
      }),
    )
    .max(10000)
    .default([]),
  exercises: z.array(prescriptionSchema).min(1).max(100),
});
export const templateSchema = z
  .object({
    id,
    name: z.string().min(1).max(100),
    description: text,
    dimension: z.enum(dimensions),
    blocks: z.array(blockSchema).min(1).max(100),
    sample: z.boolean(),
    updatedAt: timestamp,
  })
  .superRefine((t, ctx) => {
    const workSteps = t.blocks.reduce(
      (sum, b) =>
        sum + (b.mode === "amrap" ? 1 : b.rounds * b.exercises.length),
      0,
    );
    if (workSteps > 10000)
      ctx.addIssue({
        code: "custom",
        message: "Maximal 10.000 Arbeitsschritte pro Workout.",
      });
    if (t.blocks.some((b) => b.mode === "amrap" && b.exercises.length !== 1))
      ctx.addIssue({
        code: "custom",
        message: "AMRAP unterstützt eine Übung pro Block.",
      });
  });
export const scheduledSchema = z.object({
  id,
  date: dateSchema,
  kind: z.enum(["workout", "rest", "mobility"]),
  templateId: id.nullable(),
  label: z.string().min(1).max(100),
});
export const weeklyPlanSchema = z.object({
  id,
  name: z.string().min(1).max(100),
  startDate: dateSchema,
});
export const resultSchema = z.object({
  id,
  stepId: id,
  blockId: id,
  prescriptionId: id,
  exerciseId: id,
  round: posInt,
  reps: z.number().int().min(0).max(100000),
  load: z.number().min(0).max(1000),
  implements: z.union([z.literal(1), z.literal(2)]),
  seconds,
  distance: z.number().min(0).max(1000000).nullable(),
  rpe: effort,
  rir: effort,
  notes: text,
  roundsCompleted: z.number().int().min(0).max(10000).default(1),
  skipped: z.boolean(),
  pendingConfirmation: z.boolean().default(false),
  recordedAt: timestamp,
});
export const draftSchema = z.object({
  reps: z.number().int().min(0).max(100000),
  load: z.number().min(0).max(1000),
  distance: z.number().min(0).max(1000000).nullable(),
  rir: effort,
  rpe: effort,
  notes: text,
  rounds: z.number().int().min(0).max(10000),
  partial: z.number().int().min(0).max(100000),
});
export const phaseSchema = z.object({
  id,
  blockId: id,
  prescriptionId: id,
  exerciseId: id,
  round: posInt,
  kind: z.enum(["work", "rest", "transition", "prepare"]),
  duration: seconds,
  manual: z.boolean(),
});
export const timerSchema = z.object({
  status: z.enum(["idle", "running", "paused", "expired"]),
  startedAt: timestamp.nullable(),
  elapsedMs: z.number().min(0).max(1e12),
  extensionMs: z.number().min(0).max(86400000).default(0),
});
export const sessionSchema = z.object({
  id,
  scheduledId: id.nullable(),
  snapshot: templateSchema,
  exercises: z.array(exerciseSchema).min(1),
  phases: z.array(phaseSchema).min(1).max(100000),
  phaseIndex: z.number().int().min(0),
  startedAt: timestamp,
  finishedAt: timestamp.nullable(),
  timezone: z.string().max(100),
  status: z.enum(["active", "complete", "incomplete"]),
  results: z.array(resultSchema).max(100000),
  timer: timerSchema,
  activeMs: z.number().min(0).max(1e12),
  activeSince: timestamp.nullable(),
  notes: text,
  draft: draftSchema.nullable().default(null),
});
export const stateSchema = z.object({
  schemaVersion: z.literal(1),
  exercises: z.array(exerciseSchema).min(1).max(10000),
  templates: z.array(templateSchema).max(1000),
  weeklyPlans: z.array(weeklyPlanSchema).max(1000),
  scheduled: z.array(scheduledSchema).max(20000),
  sessions: z.array(sessionSchema).max(10000),
  preferences: z.object({ audio: z.boolean() }),
  checkins: z
    .array(
      z.object({
        date: dateSchema,
        energy: z.number().int().min(1).max(5),
        recovery: z.number().int().min(1).max(5),
      }),
    )
    .max(20000),
});

export type Exercise = z.infer<typeof exerciseSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type WorkoutBlock = z.infer<typeof blockSchema>;
export type WorkoutTemplate = z.infer<typeof templateSchema>;
export type ScheduledWorkout = z.infer<typeof scheduledSchema>;
export type WorkoutSession = z.infer<typeof sessionSchema>;
export type SetResult = z.infer<typeof resultSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type Timer = z.infer<typeof timerSchema>;
export type AppState = z.infer<typeof stateSchema>;
export type Mode = (typeof modes)[number];

export const uid = () => crypto.randomUUID();
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function monday(date = localDate()) {
  const d = new Date(`${date}T12:00:00`);
  return addDays(date, -((d.getDay() + 6) % 7));
}
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) {
  return new Intl.DateTimeFormat("de-DE", options).format(
    new Date(`${date}T12:00:00`),
  );
}
export const number = (n: number, digits = 0) =>
  n.toLocaleString("de-DE", { maximumFractionDigits: digits });
export const clock = (s: number) =>
  `${Math.floor(Math.max(s, 0) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(s, 0) % 60)
    .toString()
    .padStart(2, "0")}`;
export function prescription(exerciseId: string): Prescription {
  return {
    id: uid(),
    exerciseId,
    reps: 8,
    load: 0,
    implements: 1,
    side: "Beidseitig",
    tempo: "",
    rir: null,
    rpe: null,
    distance: null,
    notes: "",
  };
}
export function block(exerciseId: string): WorkoutBlock {
  return {
    id: uid(),
    name: "Trainingsblock",
    section: "Hauptteil",
    mode: "sets",
    rounds: 3,
    work: 45,
    rest: 30,
    transition: 10,
    guided: false,
    prepare: 0,
    setTargets: [],
    exercises: [prescription(exerciseId)],
  };
}

export function validateState(input: unknown): AppState {
  const s = stateSchema.parse(input);
  const unique = (ids: string[]) => new Set(ids).size === ids.length;
  if (
    ![s.exercises, s.templates, s.weeklyPlans, s.scheduled, s.sessions].every(
      (items) => unique(items.map((x) => x.id)),
    )
  )
    throw new Error("Doppelte IDs.");
  const exerciseIds = new Set(s.exercises.map((e) => e.id));
  const templateIds = new Set(s.templates.map((t) => t.id));
  if (
    s.templates.some((t) =>
      t.blocks.some((b) =>
        b.exercises.some((e) => !exerciseIds.has(e.exerciseId)),
      ),
    )
  )
    throw new Error("Fehlende Übungsreferenz.");
  if (
    s.scheduled.some(
      (p) =>
        p.kind === "workout" &&
        (!p.templateId || !templateIds.has(p.templateId)),
    )
  )
    throw new Error("Fehlende Workout-Vorlage.");
  if (s.sessions.filter((x) => x.status === "active").length > 1)
    throw new Error("Mehrere aktive Sessions.");
  for (const t of [...s.templates, ...s.sessions.map((x) => x.snapshot)]) {
    if (
      !unique(t.blocks.map((b) => b.id)) ||
      !unique(t.blocks.flatMap((b) => b.exercises.map((e) => e.id)))
    )
      throw new Error("Doppelte Block- oder Vorgaben-ID.");
    if (t.blocks.some((b) => b.mode === "amrap" && b.exercises.length !== 1))
      throw new Error("AMRAP benötigt eine Übung; verwende Runden für Zirkel.");
  }
  for (const session of s.sessions) {
    if (session.results.some((r) => r.pendingConfirmation && !r.skipped))
      throw new Error(
        "Unbestätigte Leistungen dürfen nicht als absolviert zählen.",
      );
    const ids = new Set(session.exercises.map((e) => e.id));
    if (
      session.phaseIndex >= session.phases.length ||
      session.snapshot.blocks.some((b) =>
        b.exercises.some((p) => !ids.has(p.exerciseId)),
      )
    )
      throw new Error("Ungültige Session.");
    if (
      !unique(session.results.map((r) => r.stepId)) ||
      !unique(session.phases.map((p) => p.id))
    )
      throw new Error("Doppelte Session-Schritte.");
    if ((session.status === "active") !== (session.finishedAt === null))
      throw new Error("Ungültiger Session-Abschluss.");
    if (session.finishedAt !== null && session.finishedAt < session.startedAt)
      throw new Error("Ungültige Session-Zeit.");
    const blocks = new Map(session.snapshot.blocks.map((b) => [b.id, b]));
    const phaseMap = new Map(session.phases.map((p) => [p.id, p]));
    if (
      (session.timer.status === "running") !==
      (session.timer.startedAt !== null)
    )
      throw new Error("Ungültiger Timer-Zustand.");
    for (const p of session.phases) {
      const b = blocks.get(p.blockId);
      if (
        !b?.exercises.some(
          (e) => e.id === p.prescriptionId && e.exerciseId === p.exerciseId,
        )
      )
        throw new Error("Ungültiger Phasenbezug.");
    }
    if (
      session.results.some(
        (r) =>
          !(() => {
            const p = phaseMap.get(r.stepId);
            return (
              p?.kind === "work" &&
              p.exerciseId === r.exerciseId &&
              p.blockId === r.blockId &&
              p.prescriptionId === r.prescriptionId &&
              p.round === r.round
            );
          })(),
      )
    )
      throw new Error("Ungültiges Ergebnis.");
    if (
      session.status === "complete" &&
      (session.results.some((r) => r.skipped) ||
        session.results.length !==
          session.phases.filter((p) => p.kind === "work").length)
    )
      throw new Error(
        "Ein vollständiges Workout benötigt alle Arbeitsergebnisse.",
      );
  }
  return s;
}
