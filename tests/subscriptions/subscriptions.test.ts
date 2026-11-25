import { describe, expect, it } from "vitest";
import { formatAmount, formatDate } from "@/lib/format";
import { containsSensitivePaymentInfo, SubscriptionInsertSchema } from "@/lib/validations/schema";

describe("containsSensitivePaymentInfo", () => {
  it.each(["1234567812345678", "1234-5678-9012-3456", "카드 1234 5678 9012 3456", "CVC 123", "cvv:1234", "보안코드 987"])("flags %j", (value) => {
    expect(containsSensitivePaymentInfo(value)).toBe(true);
  });

  it.each(["현대 제로카드", "신한카드 1234", "토스 체크", "월 2회 사용"])("allows %j", (value) => {
    expect(containsSensitivePaymentInfo(value)).toBe(false);
  });
});

describe("subscription form validation messages", () => {
  const base = { service_name: "넷플릭스", category: "OTT", amount: 17000, currency: "KRW", billing_cycle: "MONTHLY", billing_day: 25, next_billing_date: "2026-12-25" };
  const errorFor = (overrides: Record<string, unknown>, path: string) =>
    SubscriptionInsertSchema.safeParse({ ...base, ...overrides }).error?.issues.find((issue) => issue.path[0] === path)?.message;

  it("explains missing required fields in Korean", () => {
    expect(errorFor({ service_name: "" }, "service_name")).toBe("서비스명을 입력해 주세요.");
    expect(errorFor({ category: "" }, "category")).toBe("카테고리를 선택해 주세요.");
    expect(errorFor({ amount: undefined }, "amount")).toBe("결제 금액을 숫자로 입력해 주세요.");
    expect(errorFor({ amount: Number.NaN }, "amount")).toBe("결제 금액을 숫자로 입력해 주세요.");
    expect(errorFor({ currency: undefined }, "currency")).toBe("통화를 선택해 주세요.");
    expect(errorFor({ next_billing_date: "" }, "next_billing_date")).toBe("날짜를 선택해 주세요.");
    expect(errorFor({ amount: -1 }, "amount")).toBe("금액은 0 이상이어야 해요.");
  });

  it("rejects card numbers in the general memo too", () => {
    expect(errorFor({ memo: "카드 1234-5678-9012-3456" }, "memo")).toBe("카드번호나 보안코드 같은 민감한 결제 정보는 입력할 수 없어요.");
  });
});

describe("format", () => {
  it("formats amounts per currency without conversion", () => {
    expect(formatAmount(17000, "KRW")).toBe("₩17,000");
    expect(formatAmount(12.99, "USD")).toBe("$12.99");
    expect(formatAmount(20, "USD")).toBe("$20.00");
  });

  it("formats a calendar date without time zone shifts", () => {
    expect(formatDate("2026-03-31")).toBe("2026년 3월 31일");
  });
});
