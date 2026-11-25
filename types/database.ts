// 도메인 행 타입. 원본은 `npm run db:types`로 생성하는 types/supabase.ts (스키마와 항상 일치).
import type { Database, Enums, Tables } from "./supabase";

export type { Database };

export type CurrencyCode = Enums<"currency_code">;
export type BillingCycleType = Enums<"billing_cycle_type">;
export type SubscriptionStatus = Enums<"subscription_status">;
export type NotificationScheduleStatus = Enums<"notification_schedule_status">;

export type ProfileRow = Tables<"profiles">;
export type SubscriptionPresetRow = Tables<"subscription_presets">;
/** next_billing_date: "YYYY-MM-DD" (시간대 없는 역법 날짜), custom_alert_time: "HH:mm:ss" (Asia/Seoul) */
export type SubscriptionRow = Tables<"subscriptions">;
export type NotificationPreferenceRow = Tables<"notification_preferences">;
export type SubscriptionNotificationScheduleRow = Tables<"subscription_notification_schedules">;
export type NotificationLogRow = Tables<"notification_logs">;

export const CURRENCY_CODES = ["KRW", "USD"] as const satisfies readonly CurrencyCode[];
export const BILLING_CYCLES = ["MONTHLY", "YEARLY"] as const satisfies readonly BillingCycleType[];
export const SUBSCRIPTION_STATUSES = ["ACTIVE", "PAUSED", "TERMINATED"] as const satisfies readonly SubscriptionStatus[];
export const REMIND_DAY_OPTIONS = [1, 3, 7] as const;
