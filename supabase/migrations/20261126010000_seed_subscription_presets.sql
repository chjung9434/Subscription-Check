-- 인기 구독 서비스 프리셋 30종 (운영·로컬 공통 카탈로그 데이터)
-- 금액·해지 URL은 '퀵 프리셋 카탈로그' 작업 명세의 데이터 계약 기준. 실제 요금·경로는 서비스 사정에 따라 바뀔 수 있어 운영 점검이 필요하다.
-- 재실행해도 안전하도록 service_name 기준 upsert.

insert into public.subscription_presets
  (service_name, category, default_amount, default_currency, default_billing_cycle, cancellation_guide_text, cancellation_official_url, sort_order)
select
  p.service_name, p.category, p.default_amount, p.default_currency::public.currency_code, 'MONTHLY'::public.billing_cycle_type,
  '1. ' || p.service_name || ' 웹사이트 또는 앱에 로그인합니다.' || E'\n'
    || '2. 계정(설정) 메뉴에서 구독·멤버십 관리로 이동합니다.' || E'\n'
    || '3. 해지(구독 취소)를 선택하고 안내에 따라 완료합니다.' || E'\n'
    || '앱스토어·구글플레이로 결제했다면 해당 스토어의 구독 관리에서 해지하세요.',
  p.url, p.sort_order
from (values
  ('넷플릭스', 'OTT', 17000.00, 'KRW', 'https://www.netflix.com/youraccount', 1),
  ('유튜브 프리미엄', 'OTT', 14900.00, 'KRW', 'https://www.youtube.com/paid_memberships', 2),
  ('디즈니+', 'OTT', 9900.00, 'KRW', 'https://www.disneyplus.com/account', 3),
  ('티빙', 'OTT', 13900.00, 'KRW', 'https://www.tving.com/my/membership', 4),
  ('웨이브', 'OTT', 10900.00, 'KRW', 'https://www.wavve.com/my/voucher', 5),
  ('쿠팡 로켓와우', '쇼핑/OTT', 7890.00, 'KRW', 'https://loyalty.coupang.com/loyalty/sign-up/membership', 6),
  ('왓챠', 'OTT', 12900.00, 'KRW', 'https://watcha.com/setting/payment', 7),
  ('애플 TV+', 'OTT', 6500.00, 'KRW', 'https://support.apple.com/billing', 8),
  ('ChatGPT Plus', 'AI', 20.00, 'USD', 'https://chatgpt.com/#settings/Subscription', 9),
  ('Claude Pro', 'AI', 20.00, 'USD', 'https://claude.ai/settings/billing', 10),
  ('Midjourney Standard', 'AI', 30.00, 'USD', 'https://www.midjourney.com/account', 11),
  ('GitHub Copilot Pro', 'AI', 10.00, 'USD', 'https://github.com/settings/billing', 12),
  ('Cursor Pro', 'AI', 20.00, 'USD', 'https://www.cursor.com/settings', 13),
  ('멜론 스트리밍클럽', '음악', 10900.00, 'KRW', 'https://www.melon.com/buy/pamphlet/myCash.htm', 14),
  ('스포티파이 프리미엄', '음악', 11990.00, 'KRW', 'https://www.spotify.com/account/subscription/', 15),
  ('애플 뮤직', '음악', 8900.00, 'KRW', 'https://support.apple.com/billing', 16),
  ('지니뮤직', '음악', 9600.00, 'KRW', 'https://www.genie.co.kr/buy/myInfo', 17),
  ('FLO 무제한 듣기', '음악', 8000.00, 'KRW', 'https://www.music-flo.com/my/voucher', 18),
  ('유튜브 뮤직', '음악', 11990.00, 'KRW', 'https://www.youtube.com/paid_memberships', 19),
  ('iCloud+ 200GB', '클라우드', 4400.00, 'KRW', 'https://support.apple.com/billing', 20),
  ('Google One 100GB', '클라우드', 2400.00, 'KRW', 'https://one.google.com/settings', 21),
  ('Microsoft 365 Personal', '생산성', 8900.00, 'KRW', 'https://account.microsoft.com/services', 22),
  ('Notion Plus', '생산성', 10.00, 'USD', 'https://www.notion.so/settings', 23),
  ('Adobe Creative Cloud', '생산성', 78100.00, 'KRW', 'https://account.adobe.com/plans', 24),
  ('Dropbox Plus 2TB', '클라우드', 11.99, 'USD', 'https://www.dropbox.com/account/plan', 25),
  ('밀리의 서재', '도서', 9900.00, 'KRW', 'https://www.millie.co.kr/v3/customer/my', 26),
  ('리디셀렉트', '도서', 4900.00, 'KRW', 'https://select.ridibooks.com/settings', 27),
  ('네이버플러스 멤버십', '쇼핑', 4900.00, 'KRW', 'https://nid.naver.com/membership/my', 28),
  ('요기요 요기패스X', '생활/배달', 2900.00, 'KRW', 'https://www.yogiyo.co.kr/mobile/#/mypage/', 29),
  ('배민클럽', '생활/배달', 3990.00, 'KRW', 'https://baemin.me/club', 30)
) as p (service_name, category, default_amount, default_currency, url, sort_order)
on conflict (service_name) do update set
  category = excluded.category,
  default_amount = excluded.default_amount,
  default_currency = excluded.default_currency,
  default_billing_cycle = excluded.default_billing_cycle,
  cancellation_guide_text = excluded.cancellation_guide_text,
  cancellation_official_url = excluded.cancellation_official_url,
  sort_order = excluded.sort_order;
