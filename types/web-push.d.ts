// web-push 4.x는 타입을 제공하지 않아 이 프로젝트가 쓰는 부분만 선언한다.
declare module "web-push" {
  export interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }

  export interface RequestDetails {
    method: "POST";
    headers: Record<string, string>;
    body: Buffer | null;
    endpoint: string;
  }

  export interface RequestOptions {
    vapidDetails: { subject: string; publicKey: string; privateKey: string };
    TTL?: number;
    urgency?: "very-low" | "low" | "normal" | "high";
    topic?: string;
  }

  export function generateRequestDetails(subscription: PushSubscription, payload: string | Buffer | null, options: RequestOptions): RequestDetails;
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}
