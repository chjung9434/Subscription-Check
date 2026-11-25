import { z } from "zod";
import { BILLING_CYCLES, CURRENCY_CODES, REMIND_DAY_OPTIONS, SUBSCRIPTION_STATUSES } from "@/types/database";

/** DB 제약과 같은 규칙: 카드·계좌번호처럼 보이는 12자리 이상 연속 숫자(공백·하이픈 허용) */
const CARD_LIKE_NUMBER = /[0-9][0-9 -]{10,}[0-9]/;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 해요.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, "존재하지 않는 날짜예요.");

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "시간은 HH:mm 형식이어야 해요.");

const remindDays = z
  .array(z.union(REMIND_DAY_OPTIONS.map((day) => z.literal(day))))
  .min(1, "알림 시점을 하나 이상 선택해 주세요.")
  .max(3)
  .refine((days) => new Set(days).size === days.length, "같은 알림 시점을 중복해서 고를 수 없어요.");

const amount = z
  .number()
  .nonnegative("금액은 0 이상이어야 해요.")
  .max(9_999_999_999.99, "금액이 너무 커요.")
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "금액은 소수점 둘째 자리까지 입력할 수 있어요.");

const paymentMethodMemo = z
  .string()
  .trim()
  .max(50, "결제 수단 메모는 50자 이내로 적어 주세요.")
  .refine((value) => !CARD_LIKE_NUMBER.test(value), "카드번호나 계좌번호는 저장할 수 없어요. '현대카드'처럼 별칭만 적어 주세요.")
  .nullable();

const subscriptionFields = z.object({
  preset_id: z.uuid().nullable().optional(),
  service_name: z.string().trim().min(1, "서비스명을 입력해 주세요.").max(100),
  category: z.string().trim().min(1, "카테고리를 선택해 주세요.").max(50),
  amount,
  currency: z.enum(CURRENCY_CODES),
  billing_cycle: z.enum(BILLING_CYCLES),
  billing_day: z.number().int().min(1).max(31),
  next_billing_date: isoDate,
  payment_method_memo: paymentMethodMemo.optional(),
  memo: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  use_custom_alert: z.boolean().optional(),
  custom_alert_days: remindDays.nullable().optional(),
  custom_alert_time: timeOfDay.nullable().optional(),
});

const requireDaysForCustomAlert = (value: { use_custom_alert?: boolean; custom_alert_days?: readonly number[] | null }) =>
  !value.use_custom_alert || (value.custom_alert_days != null && value.custom_alert_days.length > 0);
const customAlertIssue = { message: "개별 알림을 켜면 알림 시점을 하나 이상 선택해야 해요.", path: ["custom_alert_days"] };

/** 구독 등록 입력. user_id는 받지 않는다 — 서버가 검증된 세션에서 채운다. */
export const SubscriptionInsertSchema = subscriptionFields.refine(requireDaysForCustomAlert, customAlertIssue);

/** 구독 수정 입력 (부분 수정) */
export const SubscriptionUpdateSchema = subscriptionFields.partial().refine(requireDaysForCustomAlert, customAlertIssue);

/** 전역 알림 설정 수정 입력 */
export const NotificationPreferenceUpdateSchema = z
  .object({
    remind_days: remindDays,
    dispatch_time: timeOfDay,
    is_enabled: z.boolean(),
  })
  .partial();

export type SubscriptionInsertInput = z.infer<typeof SubscriptionInsertSchema>;
export type SubscriptionUpdateInput = z.infer<typeof SubscriptionUpdateSchema>;
export type NotificationPreferenceUpdateInput = z.infer<typeof NotificationPreferenceUpdateSchema>;
