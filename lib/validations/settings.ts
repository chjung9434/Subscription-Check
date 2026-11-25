import { z } from "zod";

export const UpdateNotificationPreferencesSchema = z.object({
  isEnabled: z.boolean(),
  remindDays: z
    .array(z.union([z.literal(1), z.literal(3), z.literal(7)]), { error: "최소 1개 이상의 알림 시점을 선택해야 합니다." })
    .min(1, "최소 1개 이상의 알림 시점을 선택해야 합니다.")
    .refine((days) => new Set(days).size === days.length, "중복된 알림 시점이 있습니다."),
  dispatchTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "올바른 시간 형식(HH:mm)이어야 합니다."),
});
export type UpdateNotificationPreferencesInput = z.infer<typeof UpdateNotificationPreferencesSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    newPassword: z
      .string()
      .min(8, "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.")
      .max(72, "비밀번호는 72자 이하로 입력해 주세요.")
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { message: "새 비밀번호가 일치하지 않습니다.", path: ["confirmPassword"] })
  .refine((data) => data.newPassword !== data.currentPassword, { message: "현재와 다른 비밀번호를 입력해 주세요.", path: ["newPassword"] });

/** 발송 시각 선택지: 30분 단위 */
export const DISPATCH_TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  return `${hours}:${index % 2 === 0 ? "00" : "30"}`;
});
