import { describe, expect, it } from "vitest";
import { NotificationPreferenceUpdateSchema, SubscriptionInsertSchema, SubscriptionUpdateSchema } from "@/lib/validations/schema";

const valid = {
  service_name: "넷플릭스",
  category: "OTT",
  amount: 17000,
  currency: "KRW",
  billing_cycle: "MONTHLY",
  billing_day: 25,
  next_billing_date: "2026-12-25",
  payment_method_memo: "현대 제로카드",
} as const;

describe("SubscriptionInsertSchema", () => {
  it("accepts a valid subscription and trims text", () => {
    const parsed = SubscriptionInsertSchema.parse({ ...valid, service_name: "  넷플릭스 " });
    expect(parsed.service_name).toBe("넷플릭스");
  });

  it("accepts USD amounts with cents", () => {
    expect(SubscriptionInsertSchema.safeParse({ ...valid, currency: "USD", amount: 12.99 }).success).toBe(true);
  });

  it.each([
    ["negative amount", { amount: -1000 }],
    ["more than two decimals", { amount: 1.234 }],
    ["unsupported currency", { currency: "EUR" }],
    ["billing day 0", { billing_day: 0 }],
    ["billing day 32", { billing_day: 32 }],
    ["non-existent date", { next_billing_date: "2026-02-30" }],
    ["date with time", { next_billing_date: "2026-12-25T00:00:00Z" }],
    ["51-character memo", { payment_method_memo: "가".repeat(51) }],
    ["card number memo", { payment_method_memo: "1234 5678 9012 3456" }],
    ["empty service name", { service_name: "   " }],
    ["alert day 2", { use_custom_alert: true, custom_alert_days: [2] }],
    ["duplicate alert days", { use_custom_alert: true, custom_alert_days: [1, 1] }],
    ["custom alert without days", { use_custom_alert: true }],
  ])("rejects %s", (_, overrides) => {
    expect(SubscriptionInsertSchema.safeParse({ ...valid, ...overrides }).success).toBe(false);
  });

  it("allows a short card alias with the last four digits", () => {
    expect(SubscriptionInsertSchema.safeParse({ ...valid, payment_method_memo: "신한카드 1234" }).success).toBe(true);
  });

  it("does not accept user_id from input", () => {
    const parsed = SubscriptionInsertSchema.parse({ ...valid, user_id: "00000000-0000-0000-0000-000000000002" });
    expect(parsed).not.toHaveProperty("user_id");
  });
});

describe("SubscriptionUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(SubscriptionUpdateSchema.safeParse({ status: "PAUSED" }).success).toBe(true);
  });

  it("still validates provided fields", () => {
    expect(SubscriptionUpdateSchema.safeParse({ amount: -1 }).success).toBe(false);
  });
});

describe("NotificationPreferenceUpdateSchema", () => {
  it("accepts multiple remind days and a dispatch time", () => {
    expect(NotificationPreferenceUpdateSchema.safeParse({ remind_days: [1, 3, 7], dispatch_time: "08:00" }).success).toBe(true);
  });

  it.each([[{ remind_days: [] }], [{ remind_days: [5] }], [{ dispatch_time: "24:00" }]])("rejects %j", (input) => {
    expect(NotificationPreferenceUpdateSchema.safeParse(input).success).toBe(false);
  });
});
