import "server-only";

import { readTimeout } from "@/lib/data/read-timeout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BillingCycleType, CurrencyCode, SubscriptionRow, SubscriptionStatus } from "@/types/database";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SubscriptionListItem {
  id: string;
  serviceName: string;
  category: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycleType;
  nextBillingDate: string;
  paymentMethodMemo: string | null;
  status: SubscriptionStatus;
  presetId: string | null;
}

export interface SubscriptionDetail extends SubscriptionListItem {
  billingDay: number;
  memo: string | null;
  createdAt: string;
  presetGuide: { guideText: string; officialUrl: string } | null;
}

/** 로그인 사용자를 확인한다. proxy가 보호 경로를 막지만 데이터 함수도 스스로 확인한다. */
async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("로그인이 필요합니다.");
  }
  return { supabase, userId: data.user.id };
}

const toListItem = (row: Pick<SubscriptionRow, "id" | "service_name" | "category" | "amount" | "currency" | "billing_cycle" | "next_billing_date" | "payment_method_memo" | "status" | "preset_id">): SubscriptionListItem => ({
  id: row.id,
  serviceName: row.service_name,
  category: row.category,
  amount: row.amount,
  currency: row.currency,
  billingCycle: row.billing_cycle,
  nextBillingDate: row.next_billing_date,
  paymentMethodMemo: row.payment_method_memo,
  status: row.status,
  presetId: row.preset_id,
});

/** 본인 구독 목록: 다음 결제일 오름차순 */
export async function getSubscriptionsList(): Promise<SubscriptionListItem[]> {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, service_name, category, amount, currency, billing_cycle, next_billing_date, payment_method_memo, status, preset_id")
    .eq("user_id", userId)
    .order("next_billing_date", { ascending: true })
    .order("created_at", { ascending: false })
    .abortSignal(readTimeout());

  if (error) {
    console.error("[subscriptions] list query failed", { code: error.code });
    throw new Error("구독 목록을 불러오지 못했습니다.");
  }
  return data.map(toListItem);
}

/** 본인 구독 1건 + 연결된 프리셋 해지 가이드. 없거나 남의 것이면 null. */
export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  if (!UUID.test(id)) return null;
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, subscription_presets(cancellation_guide_text, cancellation_official_url)")
    .eq("id", id)
    .eq("user_id", userId)
    .abortSignal(readTimeout())
    .maybeSingle();

  if (error) {
    console.error("[subscriptions] detail query failed", { code: error.code });
    throw new Error("구독 정보를 불러오지 못했습니다.");
  }
  if (!data) return null;

  const preset = data.subscription_presets;
  return {
    ...toListItem(data),
    billingDay: data.billing_day,
    memo: data.memo,
    createdAt: data.created_at,
    presetGuide: preset ? { guideText: preset.cancellation_guide_text, officialUrl: preset.cancellation_official_url } : null,
  };
}
