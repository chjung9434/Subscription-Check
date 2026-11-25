import { describe, expect, it } from "vitest";
import { parseGuideText, SubmitCancellationReportInputSchema } from "@/lib/validations/cancellation-report";

describe("SubmitCancellationReportInputSchema", () => {
  const valid = { serviceName: "넷플릭스", reportReason: "PATH_CHANGED" as const, details: "프로필 > 멤버십 관리" };

  it("accepts a valid report", () => {
    expect(SubmitCancellationReportInputSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a reason", () => {
    const result = SubmitCancellationReportInputSchema.safeParse({ ...valid, reportReason: undefined });
    expect(result.error?.issues[0]).toMatchObject({ path: ["reportReason"], message: "제보 사유를 선택해 주세요." });
  });

  it("rejects unknown reasons and long details", () => {
    expect(SubmitCancellationReportInputSchema.safeParse({ ...valid, reportReason: "SPAM" }).success).toBe(false);
    expect(SubmitCancellationReportInputSchema.safeParse({ ...valid, details: "가".repeat(501) }).error?.issues[0]?.message).toBe(
      "상세 내용은 500자 이하로 작성해 주세요.",
    );
  });
});

describe("parseGuideText", () => {
  it("splits numbered steps from notes", () => {
    expect(parseGuideText("1. 로그인합니다.\n2. 계정 메뉴로 이동합니다.\n3. 해지를 누릅니다.\n앱스토어 결제는 스토어에서 해지하세요.")).toEqual({
      steps: ["로그인합니다.", "계정 메뉴로 이동합니다.", "해지를 누릅니다."],
      notes: ["앱스토어 결제는 스토어에서 해지하세요."],
    });
  });

  it("accepts bullets and ignores blank lines", () => {
    expect(parseGuideText("- 첫째\n\n• 둘째\r\n3) 셋째")).toEqual({ steps: ["첫째", "둘째", "셋째"], notes: [] });
  });
});
