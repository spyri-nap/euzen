export let localSignOutInProgress = false;
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const TEST_ORIGIN = "https://yvxzcawjtyqcljuoyfeg.supabase.co";
export const profileSchema = z.object({
  user_id: z.uuid(),
  display_name: z.string().trim().min(1).max(100),
  language: z.enum(["de", "en"]),
  goals: z.array(z.string().max(100)).max(12),
  equipment: z.array(z.string().max(100)).max(30),
  preferred_minutes: z.number().int().min(1).max(300).nullable(),
  experience: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
});
export type Profile = z.infer<typeof profileSchema>;
export type AuthFailure =
  | "offline"
  | "busy"
  | "cooldown"
  | "invalid_email"
  | "invalid_code"
  | "request_failed"
  | "verify_failed"
  | "session_required";
export class AccountError extends Error {
  constructor(public readonly code: AuthFailure) {
    super(code);
  }
}

/** Fail closed: this build must never accidentally connect to production. */
export function accountClient(
  url: string | undefined,
  key: string | undefined,
) {
  if (
    url !== TEST_ORIGIN ||
    !key?.startsWith("sb_publishable_") ||
    key.includes("REPLACE")
  )
    return null;
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "euzen-test-auth",
    },
  });
}

/** No training-data access here. Account adoption is a separate explicit operation. */
export class AccountService {
  private busy = false;
  private nextSend = 0;
  constructor(
    private client: SupabaseClient,
    private online = () => navigator.onLine,
    private now = () => Date.now(),
  ) {}
  get retryAt() {
    return this.nextSend;
  }
  private async exclusive<T>(task: () => Promise<T>): Promise<T> {
    if (!this.online()) throw new AccountError("offline");
    if (this.busy) throw new AccountError("busy");
    this.busy = true;
    try {
      return await task();
    } finally {
      this.busy = false;
    }
  }
  async requestCode(email: string) {
    const parsed = z.email().safeParse(email.trim());
    if (!parsed.success) throw new AccountError("invalid_email");
    return this.exclusive(async () => {
      if (this.now() < this.nextSend) throw new AccountError("cooldown");
      // Throttle failed requests too. Server limits remain authoritative across clients.
      this.nextSend = this.now() + 60_000;
      const { error } = await this.client.auth.signInWithOtp({
        email: parsed.data,
        options: { shouldCreateUser: true },
      });
      if (error) throw new AccountError("request_failed");
      return parsed.data;
    });
  }
  async verifyCode(email: string, token: string) {
    if (!z.email().safeParse(email).success || !/^\d{6,10}$/.test(token))
      throw new AccountError("invalid_code");
    return this.exclusive(async () => {
      const { data, error } = await this.client.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error || !data.session) throw new AccountError("verify_failed");
      return data.session;
    });
  }
  private async user() {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new AccountError("session_required");
    return data.user.id;
  }
  async loadProfile() {
    // Reads may overlap during StrictMode remounts; only writes require a mutex.
    if (!this.online()) throw new AccountError("offline");
    const id = await this.user();
    const { data, error } = await this.client
      .from("euzen_profiles")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();
    if (error) throw new AccountError("request_failed");
    return data ? profileSchema.parse(data) : null;
  }
  async saveProfile(input: Omit<Profile, "user_id">) {
    return this.exclusive(async () => {
      const id = await this.user();
      const profile = profileSchema.parse({ ...input, user_id: id });
      // user_id is INSERT-only in the database. Do not use upsert, which updates the PK.
      const { data: existing, error: readError } = await this.client
        .from("euzen_profiles")
        .select("user_id")
        .eq("user_id", id)
        .maybeSingle();
      if (readError) throw new AccountError("request_failed");
      const { user_id: _, ...fields } = profile;
      const query = existing
        ? this.client.from("euzen_profiles").update(fields).eq("user_id", id)
        : this.client.from("euzen_profiles").insert(profile);
      const { data, error } = await query.select("*").single();
      if (error) throw new AccountError("request_failed");
      return profileSchema.parse(data);
    });
  }
  async signOut() {
    return this.exclusive(async () => {
      localSignOutInProgress = true;
      try {
        const { error } = await this.client.auth.signOut({ scope: "local" });
        if (error) throw new AccountError("request_failed");
      } finally {
        localSignOutInProgress = false;
      }
    });
  }
}
