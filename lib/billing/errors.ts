export type BillingCalculationErrorCode = "INVALID_DATE_FORMAT" | "INVALID_BILLING_DAY" | "CALCULATION_OVERFLOW";

export class BillingCalculationError extends Error {
  constructor(
    message: string,
    public readonly code: BillingCalculationErrorCode,
  ) {
    super(message);
    this.name = "BillingCalculationError";
  }
}
