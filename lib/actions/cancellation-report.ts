"use server";

import type { FieldErrors } from "@/lib/form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmitCancellationReportInputSchema, type SubmitCancellationReportInput } from "@/lib/validations/cancellation-report";

export type ReportResult =
  | { success: true; message: string; reportId: string }
  | { success: false; error: { code: string; message: string; fieldErrors?: FieldErrors } };

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;
const FAILED = "제보 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";

export async function submitCancellationReportAction(input: SubmitCancellationReportInput): Promise<ReportResult> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요해요. 다시 로그인해 주세요." } };
  const userId = auth.user.id;

  const parsed = SubmitCancellationReportInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { success: false, error: { code: "VALIDATION_ERROR", message: "입력한 내용을 확인해 주세요.", fieldErrors } };
  }

  // 구독을 지정하면 서비스명·프리셋은 저장된 본인 구독에서 가져온다 (클라이언트 값 신뢰 안 함)
  let { presetId, serviceName } = parsed.data;
  const subscriptionId = parsed.data.subscriptionId ?? null;
  if (subscriptionId) {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("preset_id, service_name")
      .eq("id", subscriptionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("[reports] subscription lookup failed", { code: error.code });
      return { success: false, error: { code: "INTERNAL_ERROR", message: FAILED } };
    }
    if (!subscription) return { success: false, error: { code: "NOT_FOUND", message: "구독 정보를 찾을 수 없습니다." } };
    presetId = subscription.preset_id;
    serviceName = subscription.service_name;
  }

  // 같은 서비스에 대해 1분에 3건까지
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  let recent = supabase.from("cancellation_guide_reports").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  recent = presetId ? recent.eq("preset_id", presetId) : recent.eq("service_name", serviceName);
  const { count, error: countError } = await recent;
  if (countError) {
    console.error("[reports] rate check failed", { code: countError.code });
    return { success: false, error: { code: "INTERNAL_ERROR", message: FAILED } };
  }
  if ((count ?? 0) >= RATE_LIMIT) return { success: false, error: { code: "TOO_MANY_REQUESTS", message: "잠시 후 다시 시도해 주세요." } };

  const { data, error } = await supabase
    .from("cancellation_guide_reports")
    .insert({
      user_id: userId,
      preset_id: presetId ?? null,
      subscription_id: subscriptionId,
      service_name: serviceName,
      report_reason: parsed.data.reportReason,
      details: parsed.data.details || null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[reports] insert failed", { code: error.code });
    return { success: false, error: { code: "INTERNAL_ERROR", message: FAILED } };
  }
  console.info("[reports] guide report received", { reportId: data.id, presetId, reason: parsed.data.reportReason });
  return { success: true, message: "소중한 제보가 접수되었습니다. 검토 후 반영하겠습니다.", reportId: data.id };
}
