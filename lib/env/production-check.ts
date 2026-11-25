import "server-only";

import { z } from "zod";

const ProductionEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL은 올바른 URL이어야 합니다."),
  NEXT_PUBLIC_TIMEZONE: z.literal("Asia/Seoul", { error: "NEXT_PUBLIC_TIMEZONE은 반드시 'Asia/Seoul'이어야 합니다." }),
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL은 올바른 URL이어야 합니다."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({ error: "NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다." }).min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY가 필요합니다."),
  SUPABASE_SERVICE_ROLE_KEY: z.string({ error: "SUPABASE_SERVICE_ROLE_KEY가 필요합니다." }).min(1, "SUPABASE_SERVICE_ROLE_KEY가 필요합니다."),
  DATABASE_URL: z.string().min(1).optional(),
});

export type ProductionEnv = z.infer<typeof ProductionEnvSchema>;

/** 없어도 앱은 뜨지만 해당 기능이 꺼지는 설정 (값이 아니라 이름만 보고한다) */
const OPTIONAL_FEATURES: { keys: string[]; feature: string }[] = [
  { keys: ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"], feature: "웹 푸시 알림" },
  { keys: ["CRON_SECRET"], feature: "예약 알림 발송(크론)" },
];

export interface EnvCheckResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/** 필수 환경 변수 검사. 메시지에는 변수 이름만 담고 값은 절대 담지 않는다. */
export function validateProductionEnv(env: Record<string, string | undefined> = process.env): EnvCheckResult {
  const result = ProductionEnvSchema.safeParse(env);
  const warnings = OPTIONAL_FEATURES.filter(({ keys }) => keys.some((key) => !env[key])).map(
    ({ keys, feature }) => `${keys.filter((key) => !env[key]).join(", ")} 없음: ${feature} 기능이 꺼집니다.`,
  );
  if (!result.success) {
    return { valid: false, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`), warnings };
  }
  return { valid: true, warnings };
}
