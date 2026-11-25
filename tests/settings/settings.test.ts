import { describe, expect, it } from "vitest";
import { ChangePasswordSchema, DISPATCH_TIME_OPTIONS, UpdateNotificationPreferencesSchema } from "@/lib/validations/settings";

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) => result.error?.issues[0]?.message;

describe("UpdateNotificationPreferencesSchema", () => {
  const valid = { isEnabled: true, remindDays: [1, 7], dispatchTime: "09:00" };

  it("accepts single and multiple days", () => {
    expect(UpdateNotificationPreferencesSchema.safeParse(valid).success).toBe(true);
    expect(UpdateNotificationPreferencesSchema.safeParse({ ...valid, remindDays: [3] }).success).toBe(true);
  });

  it("requires at least one day", () => {
    expect(firstMessage(UpdateNotificationPreferencesSchema.safeParse({ ...valid, remindDays: [] }))).toBe("최소 1개 이상의 알림 시점을 선택해야 합니다.");
  });

  it.each([[[2]], [[5]], [[1, 1]]])("rejects remind days %j", (remindDays) => {
    expect(UpdateNotificationPreferencesSchema.safeParse({ ...valid, remindDays }).success).toBe(false);
  });

  it.each(["25:00", "8시", "8:00", "09:00:00"])("rejects dispatch time %j", (dispatchTime) => {
    expect(UpdateNotificationPreferencesSchema.safeParse({ ...valid, dispatchTime }).success).toBe(false);
  });

  it("offers 30-minute steps from 00:00 to 23:30", () => {
    expect(DISPATCH_TIME_OPTIONS).toHaveLength(48);
    expect([DISPATCH_TIME_OPTIONS[0], DISPATCH_TIME_OPTIONS[17], DISPATCH_TIME_OPTIONS.at(-1)]).toEqual(["00:00", "08:30", "23:30"]);
  });
});

describe("ChangePasswordSchema", () => {
  const valid = { currentPassword: "oldpass12", newPassword: "newpass34", confirmPassword: "newpass34" };

  it("accepts a valid change", () => {
    expect(ChangePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["short1", "abcdefgh", "12345678"])("enforces letters + digits, 8+ chars (%s)", (newPassword) => {
    expect(ChangePasswordSchema.safeParse({ ...valid, newPassword, confirmPassword: newPassword }).success).toBe(false);
  });

  it("requires the confirmation to match", () => {
    const result = ChangePasswordSchema.safeParse({ ...valid, confirmPassword: "different1" });
    expect(result.error?.issues[0]).toMatchObject({ path: ["confirmPassword"], message: "새 비밀번호가 일치하지 않습니다." });
  });

  it("requires a new password different from the current one", () => {
    const result = ChangePasswordSchema.safeParse({ currentPassword: "samepass1", newPassword: "samepass1", confirmPassword: "samepass1" });
    expect(result.error?.issues[0]?.path).toEqual(["newPassword"]);
  });
});
