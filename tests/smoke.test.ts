import { describe, expect, it } from "vitest";
import { APP_TIME_ZONE } from "@/lib/time-zone";

describe("project setup", () => {
  it("uses Asia/Seoul as the app time zone", () => {
    expect(APP_TIME_ZONE).toBe("Asia/Seoul");
  });

  it("formats dates in the app time zone", () => {
    // 2026-01-01T15:00:00Z 는 서울 기준 2026-01-02 00:00
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-01-01T15:00:00Z"));
    expect(formatted).toBe("2026-01-02");
  });
});
