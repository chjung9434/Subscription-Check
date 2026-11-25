import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActivePath } from "@/components/layout/nav-items";

describe("bottom navigation", () => {
  it("has exactly the three tabs 홈, 구독, 알림", () => {
    expect(NAV_ITEMS.map(({ label, href }) => [label, href])).toEqual([
      ["홈", "/home"],
      ["구독", "/subscriptions"],
      ["알림", "/notifications"],
    ]);
  });

  it.each([
    ["/home", "/home", true],
    ["/subscriptions", "/subscriptions", true],
    ["/subscriptions/new", "/subscriptions", true],
    ["/subscriptions/abc/edit", "/subscriptions", true],
    ["/subscriptions-archive", "/subscriptions", false],
    ["/settings/profile", "/home", false],
    ["/notifications", "/home", false],
  ])("isActivePath(%s, %s) is %s", (pathname, href, expected) => {
    expect(isActivePath(pathname, href)).toBe(expected);
  });
});
