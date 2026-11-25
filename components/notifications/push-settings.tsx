"use client";

import { Bell, BellOff, CircleAlert, Send, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { registerPushSubscriptionAction, sendTestPushAction, unregisterPushSubscriptionAction } from "@/lib/actions/push";

type Support = "checking" | "unsupported" | "ios-install" | "ready";
type Busy = null | "enable" | "disable" | "test";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function detectSupport(): Support {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return isIos && !standalone ? "ios-install" : "unsupported";
  }
  return "ready";
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  return registration ? registration.pushManager.getSubscription() : null;
}

export function PushSettings() {
  const router = useRouter();
  const [support, setSupport] = useState<Support>("checking");
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // 브라우저 기능·권한·현재 기기 구독 여부는 브라우저에서만 알 수 있다
    Promise.resolve().then(async () => {
      const detected = detectSupport();
      const subscription = detected === "ready" ? await currentSubscription() : null;
      if (cancelled) return;
      setSupport(detected);
      if (detected === "ready") setPermission(Notification.permission);
      setSubscribed(Boolean(subscription));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (kind: Exclude<Busy, null>, task: () => Promise<{ tone: "error" | "success"; text: string }>) => {
    setBusy(kind);
    setMessage(null);
    try {
      setMessage(await task());
    } catch (error) {
      console.error("[push] client action failed", error);
      setMessage({ tone: "error", text: kind === "enable" ? "알림 등록에 실패했습니다. 다시 시도해 주세요." : "요청을 처리하지 못했어요. 다시 시도해 주세요." });
    } finally {
      setBusy(null);
    }
  };

  const enable = () =>
    run("enable", async () => {
      if (!VAPID_PUBLIC_KEY) return { tone: "error", text: "알림 기능이 아직 설정되지 않았어요." };
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return { tone: "error", text: "알림 권한이 허용되지 않았어요." };
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
      const json = subscription.toJSON();
      const saved = await registerPushSubscriptionAction({
        endpoint: subscription.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
        userAgent: navigator.userAgent.slice(0, 255),
      });
      if (!saved.success) {
        await subscription.unsubscribe();
        return { tone: "error", text: saved.error.message };
      }
      setSubscribed(true);
      return { tone: "success", text: "알림이 켜졌어요. 결제일 전에 미리 알려드릴게요." };
    });

  const disable = () =>
    run("disable", async () => {
      const subscription = await currentSubscription();
      if (subscription) {
        const result = await unregisterPushSubscriptionAction({ endpoint: subscription.endpoint });
        if (!result.success) return { tone: "error", text: result.error.message };
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      return { tone: "success", text: "이 기기의 알림을 껐어요." };
    });

  const sendTest = () =>
    run("test", async () => {
      const result = await sendTestPushAction();
      if (!result.success) return { tone: "error", text: result.error.message };
      router.refresh();
      return { tone: "success", text: result.message };
    });

  return (
    <section className={cardStyles} aria-labelledby="push-heading">
      <h2 id="push-heading" className="flex items-center gap-2 text-section text-foreground">
        <Bell aria-hidden="true" className="size-5 text-primary" />
        결제 사전 알림 받기
      </h2>

      <div className="mt-3 flex flex-col gap-3" aria-live="polite">
        {support === "checking" ? (
          <p className="text-body text-muted-foreground" role="status">
            이 기기의 알림 상태를 확인하고 있어요...
          </p>
        ) : support === "ios-install" ? (
          <p className="flex gap-2 text-body text-foreground">
            <Smartphone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            iPhone·iPad에서는 Safari 공유 메뉴의 &apos;홈 화면에 추가&apos;로 구독체크를 추가한 뒤, 홈 화면 앱에서 알림을 켜 주세요.
          </p>
        ) : support === "unsupported" ? (
          <p className="text-body text-foreground">이 브라우저는 웹 푸시 알림을 지원하지 않아요. 홈 화면에서 다가오는 결제를 확인해 주세요.</p>
        ) : permission === "denied" ? (
          <p role="alert" className="flex gap-2 text-body text-status-danger-foreground">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            알림 권한이 차단되어 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용한 뒤 다시 시도해 주세요.
          </p>
        ) : subscribed ? (
          <p className="text-body text-foreground">
            <span className="font-semibold text-status-success-foreground">알림 켜짐</span> · 결제 예정일 전에 이 기기로 알려드려요.
          </p>
        ) : (
          <p className="text-body text-foreground">결제 며칠 전에 서비스명과 금액을 알려드려요. 알림 시점과 시간은 설정에서 바꿀 수 있어요.</p>
        )}

        {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

        {support === "ready" && permission !== "denied" ? (
          subscribed ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={sendTest} disabled={busy !== null} className={`${buttonStyles.primary} flex-1`}>
                {busy === "test" ? <Spinner /> : <Send aria-hidden="true" className="size-4" />}
                테스트 알림 발송
              </button>
              <button type="button" onClick={disable} disabled={busy !== null} className={`${buttonStyles.secondary} flex-1`}>
                {busy === "disable" ? <Spinner /> : <BellOff aria-hidden="true" className="size-4" />}
                알림 끄기
              </button>
            </div>
          ) : (
            <button type="button" onClick={enable} disabled={busy !== null} className={`${buttonStyles.primary} w-full`}>
              {busy === "enable" ? <Spinner /> : <Bell aria-hidden="true" className="size-4" />}
              {busy === "enable" ? "알림을 켜고 있어요..." : "알림 켜기"}
            </button>
          )
        ) : null}
      </div>
    </section>
  );
}
