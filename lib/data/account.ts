import "server-only";

import { readTimeout } from "@/lib/data/read-timeout";
import { requireSessionUser } from "@/lib/data/session-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginProvider = "email" | "kakao" | "naver" | "google";

export interface AccountSettingsProjection {
  user: { id: string; email: string; provider: LoginProvider; hasPassword: boolean; createdAt: string };
  notificationPreference: { isEnabled: boolean; remindDays: number[]; dispatchTime: string };
}

const KNOWN: readonly LoginProvider[] = ["email", "kakao", "naver", "google"];

export async function getAccountSettings(): Promise<AccountSettingsProjection> {
  const supabase = await createSupabaseServerClient();
  const user = await requireSessionUser(supabase);

  const { data: prefs, error } = await supabase
    .from("notification_preferences")
    .select("is_enabled, remind_days, dispatch_time")
    .eq("user_id", user.id)
    .abortSignal(readTimeout())
    .maybeSingle();
  if (error) {
    console.error("[settings] preferences query failed", { code: error.code });
    throw new Error("설정 정보를 불러오지 못했습니다.");
  }

  const rawProvider = typeof user.app_metadata.provider === "string" ? user.app_metadata.provider : "email";
  const provider = (KNOWN as readonly string[]).includes(rawProvider) ? (rawProvider as LoginProvider) : "email";
  const hasPassword = (user.identities ?? []).some((identity) => identity.provider === "email") || provider === "email";

  return {
    user: { id: user.id, email: user.email ?? "", provider, hasPassword, createdAt: user.created_at },
    notificationPreference: {
      isEnabled: prefs?.is_enabled ?? true,
      remindDays: prefs?.remind_days ?? [3],
      dispatchTime: (prefs?.dispatch_time ?? "08:00:00").slice(0, 5),
    },
  };
}
