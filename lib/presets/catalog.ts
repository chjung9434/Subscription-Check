import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { GetPresetsResult, PresetSummaryItem } from "./types";

export const PRESETS_CACHE_TAG = "presets-catalog";

// 실패는 캐시하지 않도록 오류는 던지고(캐시 안 됨) 바깥에서 결과로 바꾼다
const loadPresets = unstable_cache(
  async (): Promise<PresetSummaryItem[]> => {
    const { data, error } = await createSupabasePublicClient()
      .from("subscription_presets")
      .select("id, service_name, category, default_amount, default_currency, default_billing_cycle, logo_url, sort_order")
      .order("sort_order", { ascending: true });
    if (error) {
      throw new Error(`preset query failed: ${error.code ?? error.message}`);
    }
    return data.map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      category: row.category,
      defaultAmount: row.default_amount,
      defaultCurrency: row.default_currency,
      defaultBillingCycle: row.default_billing_cycle,
      logoUrl: row.logo_url,
      sortOrder: row.sort_order,
    }));
  },
  ["subscription-presets-v1"],
  { revalidate: 86_400, tags: [PRESETS_CACHE_TAG] },
);

/** 공개 프리셋 카탈로그 (24시간 캐시). 실패는 화면이 안내할 수 있도록 결과로 돌려준다. */
export async function getSubscriptionPresets(): Promise<GetPresetsResult> {
  try {
    return { success: true, data: await loadPresets() };
  } catch (error) {
    console.error("[presets] load failed", error instanceof Error ? error.message : error);
    return { success: false, error: { code: "PRESETS_UNAVAILABLE", message: "프리셋을 불러오지 못했습니다." } };
  }
}
