-- 로컬 개발용 시드 (supabase db reset 시 실행). 운영 DB에서 실행하지 마세요.
-- 프리셋 30종은 마이그레이션(20261126010000_seed_subscription_presets.sql)에 있어 운영에도 반영됩니다.

-- ---------------------------------------------------------------------------
-- 1. 테스트 사용자 A, B (가입 트리거가 profiles·notification_preferences 생성)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'user-a@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'user-b@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- 사용자 A는 1일·3일 전 알림, 오전 9시
update public.notification_preferences
set remind_days = '{1,3}', dispatch_time = '09:00:00'
where user_id = '00000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- 2. 샘플 구독 (고정 날짜 기준: 2026-11-25 작성)
-- ---------------------------------------------------------------------------
insert into public.subscriptions
  (id, user_id, preset_id, service_name, category, amount, currency, billing_cycle, billing_day, next_billing_date, payment_method_memo, memo, status, use_custom_alert, custom_alert_days, custom_alert_time)
values
  -- A: KRW 월간
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   (select id from public.subscription_presets where service_name = '넷플릭스'),
   '넷플릭스', 'OTT', 17000.00, 'KRW', 'MONTHLY', 25, '2026-12-25', '현대 제로카드', null, 'ACTIVE', false, null, null),
  -- A: USD 월간 + 개별 알림(7일·1일 전, 오후 8시)
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   (select id from public.subscription_presets where service_name = 'ChatGPT Plus'),
   'ChatGPT Plus', 'AI', 20.00, 'USD', 'MONTHLY', 15, '2026-12-15', '해외결제 체크카드', '업무용', 'ACTIVE', true, '{1,7}', '20:00:00'),
  -- A: KRW 연간
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   (select id from public.subscription_presets where service_name = '쿠팡 로켓와우'),
   '쿠팡플레이', 'OTT', 59800.00, 'KRW', 'YEARLY', 30, '2026-11-30', '신한카드', '연간 결제', 'ACTIVE', false, null, null),
  -- A: 말일 보정 케이스 (청구 기준일 31일, 11월은 30일로 보정)
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   (select id from public.subscription_presets where service_name = 'Notion Plus'),
   '노션', '생산성', 12.00, 'USD', 'MONTHLY', 31, '2026-11-30', '해외결제 체크카드', null, 'ACTIVE', false, null, null),
  -- A: 결제 확인 필요 케이스 (결제 예정일 경과)
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
   (select id from public.subscription_presets where service_name = '멜론 스트리밍클럽'),
   '멜론', '음악', 10900.00, 'KRW', 'MONTHLY', 20, '2026-11-20', '카카오페이', null, 'ACTIVE', false, null, null),
  -- A: 일시 중지
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
   (select id from public.subscription_presets where service_name = '왓챠'),
   '왓챠', 'OTT', 7900.00, 'KRW', 'MONTHLY', 5, '2026-12-05', null, '잠시 쉬는 중', 'PAUSED', false, null, null),
  -- B: 격리 검증용
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
   (select id from public.subscription_presets where service_name = '유튜브 프리미엄'),
   '유튜브 프리미엄', 'OTT', 14900.00, 'KRW', 'MONTHLY', 10, '2026-12-10', '국민카드', null, 'ACTIVE', false, null, null),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   (select id from public.subscription_presets where service_name = 'Claude Pro'),
   'Claude Pro', 'AI', 20.00, 'USD', 'MONTHLY', 3, '2026-12-03', '해외결제 카드', null, 'ACTIVE', false, null, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. 샘플 알림 스케줄·로그
-- ---------------------------------------------------------------------------
insert into public.subscription_notification_schedules
  (subscription_id, user_id, target_date, days_before, scheduled_at, status, idempotency_key)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-12-25', 3,
   '2026-12-22 09:00:00+09', 'PENDING', '10000000-0000-0000-0000-000000000001_2026-12-25_3'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-12-10', 3,
   '2026-12-07 08:00:00+09', 'PENDING', '20000000-0000-0000-0000-000000000001_2026-12-10_3')
on conflict (idempotency_key) do nothing;

insert into public.notification_logs (id, user_id, subscription_id, title, body, sent_at)
values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005',
   '멜론 결제 1일 전이에요', '내일(11월 20일) ₩10,900이 결제될 예정이에요.', '2026-11-19 09:00:00+09'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   '유튜브 프리미엄 결제 3일 전이에요', '11월 10일 ₩14,900이 결제될 예정이에요.', '2026-11-07 08:00:00+09')
on conflict (id) do nothing;
