import { describe, expect, it } from "vitest";
import { buildReminderPayload, buildTestPayload } from "@/lib/notifications/payload";
import { isAllowedPushEndpoint } from "@/lib/notifications/push-endpoint";
import { planSchedules } from "@/lib/notifications/schedule-plan";
import { addDays, seoulDateTimeToIso } from "@/lib/time/seoul";

describe("Seoul time conversion", () => {
  it("converts 08:00 KST to 23:00 UTC of the previous day", () => {
    expect(seoulDateTimeToIso("2026-12-22", "08:00:00")).toBe("2026-12-21T23:00:00.000Z");
    expect(seoulDateTimeToIso("2026-12-22", "20:30")).toBe("2026-12-22T11:30:00.000Z");
  });

  it("adds and subtracts calendar days across months and years", () => {
    expect(addDays("2026-12-25", -3)).toBe("2026-12-22");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("planSchedules", () => {
  const base = { subscriptionId: "sub-1", nextBillingDate: "2026-12-25", dispatchTime: "08:00:00" };

  it("creates D-7, D-3, D-1 at the dispatch time in KST", () => {
    const plan = planSchedules({ ...base, daysBefore: [1, 3, 7], now: new Date("2026-11-25T00:00:00Z") });
    expect(plan).toEqual([
      { daysBefore: 7, targetDate: "2026-12-25", scheduledAt: "2026-12-17T23:00:00.000Z", idempotencyKey: "sub-1_2026-12-25_7" },
      { daysBefore: 3, targetDate: "2026-12-25", scheduledAt: "2026-12-21T23:00:00.000Z", idempotencyKey: "sub-1_2026-12-25_3" },
      { daysBefore: 1, targetDate: "2026-12-25", scheduledAt: "2026-12-23T23:00:00.000Z", idempotencyKey: "sub-1_2026-12-25_1" },
    ]);
  });

  it("skips times that have already passed", () => {
    // 지금이 12월 22일 09:00 KST: D-7(12/18), D-3(12/22 08:00)은 지남, D-1만 남음
    const plan = planSchedules({ ...base, daysBefore: [1, 3, 7], now: new Date("2026-12-22T00:00:00Z") });
    expect(plan.map((item) => item.daysBefore)).toEqual([1]);
  });

  it("ignores duplicates and unsupported days", () => {
    const plan = planSchedules({ ...base, daysBefore: [3, 3, 2, 30], now: new Date("2026-11-25T00:00:00Z") });
    expect(plan.map((item) => item.daysBefore)).toEqual([3]);
  });
});

describe("push payloads", () => {
  it("builds the reminder text with amount, date and payment memo", () => {
    const payload = buildReminderPayload({
      subscriptionId: "abc",
      serviceName: "넷플릭스",
      amount: 17000,
      currency: "KRW",
      paymentMethodMemo: "현대 제로카드",
      targetDate: "2026-12-25",
      daysBefore: 3,
      now: new Date("2026-12-21T23:00:00Z"),
    });
    expect(payload).toEqual({
      title: "[결제 D-3] 넷플릭스 결제 예정",
      body: "2026년 12월 25일에 ₩17,000이 현대 제로카드로 결제될 예정입니다.",
      url: "/subscriptions/abc",
      tag: "sub-abc-2026-12-25",
      timestamp: Date.parse("2026-12-21T23:00:00Z"),
    });
  });

  it("omits the payment memo when there is none and keeps the original currency", () => {
    const payload = buildReminderPayload({
      subscriptionId: "x",
      serviceName: "ChatGPT Plus",
      amount: 20,
      currency: "USD",
      paymentMethodMemo: null,
      targetDate: "2026-12-15",
      daysBefore: 1,
      now: new Date(),
    });
    expect(payload.body).toBe("2026년 12월 15일에 $20.00이 결제될 예정입니다.");
  });

  it("uses the spec's test message", () => {
    expect(buildTestPayload(new Date(0))).toMatchObject({ title: "[구독체크] 결제 사전 알림 테스트", url: "/notifications", tag: "test-push" });
  });
});

describe("isAllowedPushEndpoint", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/abc",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
  ])("allows %s", (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(true);
  });

  it.each([
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://fcm.googleapis.com:8443/x",
    "https://evil.example/fcm.googleapis.com",
    "https://fcm.googleapis.com.evil.example/x",
    "https://169.254.169.254/latest/meta-data",
    "http://127.0.0.1:54321/rest/v1",
    "not a url",
  ])("rejects %s", (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false);
  });

  it("allows only the configured test origin when one is set", () => {
    expect(isAllowedPushEndpoint("http://127.0.0.1:4010/push/1", "http://127.0.0.1:4010")).toBe(true);
    expect(isAllowedPushEndpoint("http://127.0.0.1:4011/push/1", "http://127.0.0.1:4010")).toBe(false);
  });
});
