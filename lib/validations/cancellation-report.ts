import { z } from "zod";

export const REPORT_REASONS = ["PATH_CHANGED", "LINK_BROKEN", "OTHER"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  PATH_CHANGED: "해지 메뉴 경로가 다름",
  LINK_BROKEN: "공식 링크가 열리지 않거나 잘못됨",
  OTHER: "기타 의견",
};

export const SubmitCancellationReportInputSchema = z.object({
  subscriptionId: z.uuid("올바른 구독 식별자 형식이 아닙니다.").optional().nullable(),
  presetId: z.uuid("올바른 프리셋 식별자 형식이 아닙니다.").optional().nullable(),
  serviceName: z.string().trim().min(1, "서비스명을 입력해 주세요.").max(100, "100자 이하로 입력해 주세요."),
  reportReason: z.enum(REPORT_REASONS, { error: "제보 사유를 선택해 주세요." }),
  details: z.string().trim().max(500, "상세 내용은 500자 이하로 작성해 주세요.").optional().nullable(),
});
export type SubmitCancellationReportInput = z.infer<typeof SubmitCancellationReportInputSchema>;

/** 저장된 해지 가이드 텍스트를 번호 단계와 참고 문장으로 나눈다 ("1. ..." 형식 줄은 단계) */
export function parseGuideText(text: string): { steps: string[]; notes: string[] } {
  const steps: string[] = [];
  const notes: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const step = /^(?:\d+[.)]|[-•·])\s*(.+)$/.exec(line);
    if (step) steps.push(step[1]);
    else notes.push(line);
  }
  return { steps, notes };
}
