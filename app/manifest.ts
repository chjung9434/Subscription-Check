import type { MetadataRoute } from "next";

/** 홈 화면에 추가(PWA)용 — iOS Safari는 홈 화면에 추가된 웹앱에서만 Web Push를 허용한다 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "구독체크",
    short_name: "구독체크",
    description: "흩어진 구독 결제일과 지출을 한곳에서 관리하세요.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#f9fafb",
    lang: "ko",
  };
}
