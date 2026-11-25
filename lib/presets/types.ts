import type { BillingCycleType, CurrencyCode } from "@/types/database";

export interface PresetSummaryItem {
  id: string;
  serviceName: string;
  category: string;
  defaultAmount: number;
  defaultCurrency: CurrencyCode;
  defaultBillingCycle: BillingCycleType;
  logoUrl: string | null;
  sortOrder: number;
}

export type GetPresetsResult =
  | { success: true; data: PresetSummaryItem[] }
  | { success: false; error: { code: string; message: string } };
