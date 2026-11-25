import { describe, expect, it } from "vitest";
import { validateProductionEnv } from "@/lib/env/production-check";

const valid = {
  NEXT_PUBLIC_APP_URL: "https://app.example.com",
  NEXT_PUBLIC_TIMEZONE: "Asia/Seoul",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub",
  VAPID_PRIVATE_KEY: "priv",
  VAPID_SUBJECT: "mailto:ops@example.com",
  CRON_SECRET: "cron",
};

describe("validateProductionEnv", () => {
  it("passes with every required value", () => {
    expect(validateProductionEnv(valid)).toEqual({ valid: true, warnings: [] });
  });

  it("reports each missing or invalid required value by name only", () => {
    const result = validateProductionEnv({ ...valid, SUPABASE_SERVICE_ROLE_KEY: undefined, NEXT_PUBLIC_TIMEZONE: "UTC", NEXT_PUBLIC_APP_URL: "not-a-url" });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY가 필요합니다.",
        "NEXT_PUBLIC_TIMEZONE: NEXT_PUBLIC_TIMEZONE은 반드시 'Asia/Seoul'이어야 합니다.",
        "NEXT_PUBLIC_APP_URL: NEXT_PUBLIC_APP_URL은 올바른 URL이어야 합니다.",
      ]),
    );
    expect(JSON.stringify(result)).not.toContain("service");
  });

  it("warns about optional features that are switched off", () => {
    const result = validateProductionEnv({ ...valid, CRON_SECRET: undefined, VAPID_PRIVATE_KEY: "" });
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(["VAPID_PRIVATE_KEY 없음: 웹 푸시 알림 기능이 꺼집니다.", "CRON_SECRET 없음: 예약 알림 발송(크론) 기능이 꺼집니다."]);
  });
});
