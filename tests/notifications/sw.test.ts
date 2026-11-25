import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

type Listener = (event: { data?: { json: () => unknown; text: () => string }; notification?: unknown; waitUntil: (p: Promise<unknown>) => void }) => void;

/** public/sw.js를 가짜 서비스 워커 전역에서 실행 */
function loadServiceWorker(windows: { url: string; focus: () => Promise<{ navigate: (url: string) => Promise<void> }> }[] = []) {
  const listeners: Record<string, Listener> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const openWindow = vi.fn().mockResolvedValue(undefined);
  const self = {
    location: { origin: "https://app.example" },
    registration: { showNotification },
    clients: { matchAll: vi.fn().mockResolvedValue(windows), openWindow },
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), { self, URL });
  const fire = async (type: string, event: Omit<Parameters<Listener>[0], "waitUntil">) => {
    const pending: Promise<unknown>[] = [];
    listeners[type]({ ...event, waitUntil: (promise) => pending.push(promise) });
    await Promise.all(pending);
  };
  return { fire, showNotification, openWindow };
}

const pushData = (payload: unknown) => ({ json: () => payload, text: () => JSON.stringify(payload) });

describe("service worker", () => {
  it("shows the pushed title and body with the target URL", async () => {
    const sw = loadServiceWorker();
    await sw.fire("push", { data: pushData({ title: "[결제 D-3] 넷플릭스 결제 예정", body: "본문", url: "/subscriptions/abc", tag: "sub-abc" }) });
    expect(sw.showNotification).toHaveBeenCalledWith("[결제 D-3] 넷플릭스 결제 예정", expect.objectContaining({ body: "본문", tag: "sub-abc", data: { url: "/subscriptions/abc" } }));
  });

  it("only keeps same-site paths as the click target", async () => {
    const sw = loadServiceWorker();
    for (const url of ["//evil.example/x", "https://evil.example", "javascript:alert(1)"]) {
      await sw.fire("push", { data: pushData({ title: "t", url }) });
      expect(sw.showNotification).toHaveBeenLastCalledWith("t", expect.objectContaining({ data: { url: "/home" } }));
    }
  });

  it("falls back to text when the payload is not JSON", async () => {
    const sw = loadServiceWorker();
    await sw.fire("push", { data: { json: () => JSON.parse("not json"), text: () => "plain" } });
    expect(sw.showNotification).toHaveBeenCalledWith("구독체크", expect.objectContaining({ body: "plain" }));
  });

  it("opens the subscription page on click, reusing an open tab when there is one", async () => {
    const navigate = vi.fn().mockResolvedValue(undefined);
    const focus = vi.fn().mockResolvedValue({ navigate });
    const withTab = loadServiceWorker([{ url: "https://app.example/home", focus }]);
    const close = vi.fn();
    await withTab.fire("notificationclick", { notification: { close, data: { url: "/subscriptions/abc" } } });
    expect(close).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("https://app.example/subscriptions/abc");

    const noTab = loadServiceWorker();
    await noTab.fire("notificationclick", { notification: { close, data: { url: "/subscriptions/abc" } } });
    expect(noTab.openWindow).toHaveBeenCalledWith("https://app.example/subscriptions/abc");
  });
});
