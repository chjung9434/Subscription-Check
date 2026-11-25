import type { CurrencyCode } from "@/types/database";

const AMOUNT_FORMATTERS: Record<CurrencyCode, Intl.NumberFormat> = {
  KRW: new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }),
};

/** 통화별 금액 표기 (환산 없음): ₩17,000 / $20.00 */
export function formatAmount(amount: number, currency: CurrencyCode): string {
  return AMOUNT_FORMATTERS[currency].format(amount);
}

/** "2026-12-25" → "2026년 12월 25일" (시간대 변환 없이 역법 날짜 그대로) */
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

const SEOUL_DATE_TIME = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

/** 시각(timestamptz)을 서울 기준으로: "11월 25일 오전 9:00" */
export function formatSeoulDateTime(iso: string): string {
  return SEOUL_DATE_TIME.format(new Date(iso));
}
