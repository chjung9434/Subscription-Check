import type { BillingCycleType } from "./database";

export type BillingCycle = BillingCycleType;

export interface NextBillingDateInput {
  /** YYYY-MM-DD (시간대 없는 역법 날짜) */
  currentDate: string;
  billingCycle: BillingCycle;
  /** 원 청구 기준일 1~31 */
  billingDay: number;
}

export interface AdvanceBillingCycleInput extends NextBillingDateInput {
  /** YYYY-MM-DD. 주면 이 날짜보다 뒤가 될 때까지 주기를 진행, 없으면 정확히 1주기 */
  targetDate?: string;
}
