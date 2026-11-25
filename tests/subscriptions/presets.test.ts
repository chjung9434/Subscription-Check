import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inCategoryGroup, matchesPresetQuery, PRESET_CATEGORY_GROUPS, toChoseong } from "@/lib/presets/search";

describe("matchesPresetQuery", () => {
  it.each([
    ["넷플릭스", "넷플"],
    ["ChatGPT Plus", "chat"],
    ["ChatGPT Plus", "gpt plus"],
    ["넷플릭스", "ㄴㅍ"],
    ["멜론 스트리밍클럽", "ㅅㅌㄹㅁ"],
    ["유튜브 프리미엄", ""],
  ])("%s matches %j", (name, query) => {
    expect(matchesPresetQuery(name, query)).toBe(true);
  });

  it.each([
    ["넷플릭스", "디즈니"],
    ["ChatGPT Plus", "claude"],
    ["넷플릭스", "ㄷㅈ"],
  ])("%s does not match %j", (name, query) => {
    expect(matchesPresetQuery(name, query)).toBe(false);
  });

  it("converts only Hangul syllables to initial consonants", () => {
    expect(toChoseong("애플 TV+")).toBe("ㅇㅍ TV+");
  });
});

describe("preset catalog migration", () => {
  const sql = readFileSync("supabase/migrations/20261126010000_seed_subscription_presets.sql", "utf8");
  const rows = [...sql.matchAll(/^\s+\('([^']+)', '([^']+)', ([\d.]+), '(KRW|USD)', '(https:\/\/[^']+)', (\d+)\)/gm)];

  it("defines 30 unique presets with every required field", () => {
    expect(rows).toHaveLength(30);
    expect(new Set(rows.map((row) => row[1])).size).toBe(30);
    expect(rows.map((row) => Number(row[6]))).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("maps dollar-billed tools to USD", () => {
    const usd = rows.filter((row) => row[4] === "USD").map((row) => row[1]);
    expect(usd).toEqual(expect.arrayContaining(["ChatGPT Plus", "Claude Pro", "Notion Plus", "Cursor Pro"]));
    expect(rows.find((row) => row[1] === "넷플릭스")?.[4]).toBe("KRW");
  });

  it("puts every preset category into a filter chip", () => {
    for (const row of rows) {
      const groups = PRESET_CATEGORY_GROUPS.filter((group) => group.id !== "all" && inCategoryGroup(row[2], group.id));
      expect(groups.length, row[2]).toBe(1);
    }
  });
});
