import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AccountService,
  accountClient,
  profileSchema,
  TEST_ORIGIN,
} from "./auth";

function fixture(online = true) {
  const auth = {
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({
      error: null,
      data: { session: { user: { id: "a" } } },
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  let time = 1000;
  const service = new AccountService(
    { auth } as unknown as SupabaseClient,
    () => online,
    () => time,
  );
  return {
    auth,
    service,
    advance: () => {
      time += 60_001;
    },
  };
}
describe("account boundary", () => {
  it("rejects wrong projects, secret keys and placeholders", () => {
    expect(
      accountClient("https://other.supabase.co", "sb_publishable_test"),
    ).toBeNull();
    expect(accountClient(TEST_ORIGIN, "sb_secret_test")).toBeNull();
    expect(
      accountClient(TEST_ORIGIN, "sb_publishable_REPLACE_IN_ENVIRONMENT"),
    ).toBeNull();
    expect(accountClient(undefined, undefined)).toBeNull();
  });
  it("does not send offline requests or malformed emails", async () => {
    const f = fixture(false);
    await expect(
      f.service.requestCode("user@example.com"),
    ).rejects.toMatchObject({ code: "offline" });
    expect(f.auth.signInWithOtp).not.toHaveBeenCalled();
    await expect(fixture().service.requestCode("bad")).rejects.toMatchObject({
      code: "invalid_email",
    });
  });
  it("trims email and enforces resend cooldown", async () => {
    const f = fixture();
    expect(await f.service.requestCode(" user@example.com ")).toBe(
      "user@example.com",
    );
    await expect(
      f.service.requestCode("user@example.com"),
    ).rejects.toMatchObject({ code: "cooldown" });
    f.advance();
    await f.service.requestCode("user@example.com");
    expect(f.auth.signInWithOtp).toHaveBeenCalledTimes(2);
  });
  it("blocks double submits while a request is pending", async () => {
    const f = fixture();
    let resolve!: (value: { error: null }) => void;
    f.auth.signInWithOtp.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const pending = f.service.requestCode("user@example.com");
    await expect(
      f.service.requestCode("user@example.com"),
    ).rejects.toMatchObject({ code: "busy" });
    resolve({ error: null });
    await pending;
  });
  it("does not expose backend error messages or account existence", async () => {
    const f = fixture();
    f.auth.signInWithOtp.mockResolvedValueOnce({
      error: { message: "private backend detail" },
    });
    await expect(
      f.service.requestCode("user@example.com"),
    ).rejects.toMatchObject({ message: "request_failed" });
    await expect(
      f.service.requestCode("user@example.com"),
    ).rejects.toMatchObject({ code: "cooldown" });
  });
  it("rejects invalid or expired codes and uses email verification", async () => {
    const f = fixture();
    await expect(
      f.service.verifyCode("user@example.com", "abc"),
    ).rejects.toMatchObject({ code: "invalid_code" });
    await f.service.verifyCode("user@example.com", "123456");
    expect(f.auth.verifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "123456",
      type: "email",
    });
    f.auth.verifyOtp.mockResolvedValueOnce({
      error: { message: "expired" },
      data: { session: null },
    });
    await expect(
      f.service.verifyCode("user@example.com", "123456"),
    ).rejects.toMatchObject({ code: "verify_failed" });
  });
  it("signs out this device without deleting the account", async () => {
    const f = fixture();
    await f.service.signOut();
    expect(f.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("validates profile lengths and optional fields", () => {
    const valid = {
      user_id: "00000000-0000-4000-8000-000000000001",
      display_name: " Name ",
      language: "en",
      goals: [],
      equipment: [],
      preferred_minutes: null,
      experience: null,
    };
    expect(profileSchema.parse(valid).display_name).toBe("Name");
    expect(
      profileSchema.safeParse({ ...valid, display_name: " " }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...valid, preferred_minutes: 301 }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...valid, goals: Array(13).fill("goal") })
        .success,
    ).toBe(false);
  });
});
