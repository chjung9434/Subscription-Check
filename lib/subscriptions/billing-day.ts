/** "YYYY-MM-DD"에서 일(1~31)을 꺼낸다. 시간대 변환 없이 문자열 그대로 읽는다. 형식이 아니면 null. */
export function billingDayOf(date: string): number | null {
  const match = /^\d{4}-\d{2}-(\d{2})$/.exec(date);
  if (!match) return null;
  const day = Number(match[1]);
  return day >= 1 && day <= 31 ? day : null;
}
