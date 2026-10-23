import { type AppState } from "./model";
/** Separate from demonstration fixtures: new installations contain no authored data. */
export function emptyState(): AppState {
  return {
    schemaVersion: 1,
    exercises: [],
    templates: [],
    weeklyPlans: [],
    scheduled: [],
    sessions: [],
    checkins: [],
    preferences: { audio: false, language: "de", onboardingStep: 0 },
  };
}
