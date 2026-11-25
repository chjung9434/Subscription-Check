import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

/**
 * 데이터 조회용 로그인 사용자. 세션이 없거나 만료됐으면 로그인 화면으로 보내고,
 * 인증 서버 장애(네트워크·5xx)는 로그인 문제로 숨기지 않고 오류로 던져 오류 화면이 안내하게 한다.
 */
export async function requireSessionUser(supabase: SupabaseClient<Database>): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (data.user) return data.user;
  if (error && (error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500)) {
    console.error("[auth] user lookup failed", { name: error.name, status: error.status });
    throw new Error("인증 서버에 연결하지 못했습니다.");
  }
  redirect("/auth/login");
}
