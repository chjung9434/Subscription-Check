const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

/** "넷플릭스" → "ㄴㅍㄹㅅ" (한글 음절만 초성으로, 나머지는 그대로) */
export function toChoseong(value: string): string {
  return Array.from(value, (char) => {
    const code = char.charCodeAt(0);
    return code >= HANGUL_START && code <= HANGUL_END ? CHOSEONG[Math.floor((code - HANGUL_START) / 588)] : char;
  }).join("");
}

const isChoseongOnly = (value: string) => value.length > 0 && Array.from(value).every((char) => CHOSEONG.includes(char));

/** 대소문자·공백 무시 부분 일치 + 초성만 입력한 경우 초성 일치 ("넷플", "chat", "ㄴㅍ") */
export function matchesPresetQuery(serviceName: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const name = normalize(serviceName);
  if (name.includes(q)) return true;
  return isChoseongOnly(q) && toChoseong(name).includes(q);
}

/** 카테고리 칩: 프리셋 카테고리를 화면용 묶음으로 */
export const PRESET_CATEGORY_GROUPS = [
  { id: "all", label: "전체", categories: null },
  { id: "ott", label: "OTT", categories: ["OTT", "쇼핑/OTT"] },
  { id: "ai", label: "AI", categories: ["AI"] },
  { id: "music", label: "음악", categories: ["음악"] },
  { id: "work", label: "생산성/클라우드", categories: ["생산성", "클라우드"] },
  { id: "life", label: "도서/생활", categories: ["도서", "쇼핑", "생활/배달"] },
] as const;

export type PresetCategoryGroupId = (typeof PRESET_CATEGORY_GROUPS)[number]["id"];

export function inCategoryGroup(category: string, groupId: PresetCategoryGroupId): boolean {
  const group = PRESET_CATEGORY_GROUPS.find((item) => item.id === groupId);
  return !group || group.categories === null || (group.categories as readonly string[]).includes(category);
}
