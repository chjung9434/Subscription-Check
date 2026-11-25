import "server-only";

import { readTimeout } from "@/lib/data/read-timeout";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  isRead: boolean;
  status: string;
}

/** 로그인 사용자의 최근 알림 30건 (최신순) */
export async function getNotificationHistory(): Promise<NotificationHistoryItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("notification_logs")
    .select("id, title, body, sent_at, is_read, status")
    .eq("user_id", auth.user.id)
    .order("sent_at", { ascending: false })
    .limit(30)
    .abortSignal(readTimeout());
  if (error) {
    console.error("[notifications] history query failed", { code: error.code });
    throw new Error("알림 내역을 불러오지 못했습니다.");
  }
  return data.map((row) => ({ id: row.id, title: row.title, body: row.body, sentAt: row.sent_at, isRead: row.is_read, status: row.status }));
}
