-- 구독체크 핵심 스키마: 열거형, 6개 테이블, 트리거, RLS, 권한, 인덱스
-- 날짜 규칙: 결제일 등 역법 날짜는 date, 시각 인스턴트는 timestamptz. 비즈니스 연산 기준 시간대는 Asia/Seoul.

-- ---------------------------------------------------------------------------
-- 1. 열거형
-- ---------------------------------------------------------------------------
create type public.currency_code as enum ('KRW', 'USD');
create type public.billing_cycle_type as enum ('MONTHLY', 'YEARLY');
create type public.subscription_status as enum ('ACTIVE', 'PAUSED', 'TERMINATED');
create type public.notification_schedule_status as enum ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- 2. 테이블
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email varchar(255),
  display_name varchar(100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_presets (
  id uuid primary key default gen_random_uuid(),
  service_name varchar(100) not null unique,
  category varchar(50) not null,
  default_amount numeric(12, 2) not null default 0.00 check (default_amount >= 0),
  default_currency public.currency_code not null default 'KRW',
  default_billing_cycle public.billing_cycle_type not null default 'MONTHLY',
  logo_url text,
  cancellation_guide_text text not null,
  cancellation_official_url text not null check (cancellation_official_url ~ '^https://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preset_id uuid references public.subscription_presets (id) on delete set null,
  service_name varchar(100) not null check (length(btrim(service_name)) > 0),
  category varchar(50) not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency public.currency_code not null default 'KRW',
  billing_cycle public.billing_cycle_type not null default 'MONTHLY',
  billing_day integer not null check (billing_day between 1 and 31),
  next_billing_date date not null,
  -- 결제 수단은 별칭 메모만 허용: 50자 제한 + 카드/계좌번호처럼 보이는 연속 숫자(12자리 이상) 거부
  payment_method_memo varchar(50)
    check (payment_method_memo is null or payment_method_memo !~ '[0-9][0-9 -]{10,}[0-9]'),
  memo text,
  status public.subscription_status not null default 'ACTIVE',
  use_custom_alert boolean not null default false,
  custom_alert_days integer[]
    check (custom_alert_days is null or (cardinality(custom_alert_days) between 1 and 3 and custom_alert_days <@ array[1, 3, 7])),
  custom_alert_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_custom_alert_days_required
    check (not use_custom_alert or custom_alert_days is not null)
);

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  remind_days integer[] not null default '{3}'
    check (cardinality(remind_days) between 1 and 3 and remind_days <@ array[1, 3, 7]),
  dispatch_time time not null default '08:00:00',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_notification_schedules (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  target_date date not null,
  days_before integer not null check (days_before in (1, 3, 7)),
  scheduled_at timestamptz not null,
  status public.notification_schedule_status not null default 'PENDING',
  idempotency_key text not null unique,
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  title varchar(200) not null,
  body text not null,
  channel varchar(20) not null default 'WEB_PUSH',
  sent_at timestamptz not null default now(),
  is_read boolean not null default false,
  status varchar(20) not null default 'SUCCESS' check (status in ('SUCCESS', 'FAILURE')),
  error_message text
);

-- ---------------------------------------------------------------------------
-- 3. 인덱스 (조회 패턴 + 외래키 + RLS 컬럼)
-- ---------------------------------------------------------------------------
create index idx_subscriptions_user_status on public.subscriptions (user_id, status);
create index idx_subscriptions_user_next_billing on public.subscriptions (user_id, next_billing_date);
create index idx_subscriptions_preset on public.subscriptions (preset_id);
create index idx_sub_notif_sched_due on public.subscription_notification_schedules (status, scheduled_at)
  where status = 'PENDING';
create index idx_sub_notif_sched_user on public.subscription_notification_schedules (user_id);
create index idx_sub_notif_sched_subscription on public.subscription_notification_schedules (subscription_id);
create index idx_notification_logs_user_sent on public.notification_logs (user_id, sent_at desc);
create index idx_notification_logs_subscription on public.notification_logs (subscription_id);

-- ---------------------------------------------------------------------------
-- 4. 함수 및 트리거
-- ---------------------------------------------------------------------------
create function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.subscription_notification_schedules
  for each row execute function public.handle_updated_at();

-- 신규 가입 시 프로필과 기본 알림 설정을 같은 트랜잭션에서 생성
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 트리거 전용 함수: API 역할이 직접 호출하지 못하게 한다
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. 권한: 기본 권한 회수 후 역할별 최소 권한만 부여
-- ---------------------------------------------------------------------------
revoke all on table
  public.profiles,
  public.subscription_presets,
  public.subscriptions,
  public.notification_preferences,
  public.subscription_notification_schedules,
  public.notification_logs
from anon, authenticated;

grant select on table public.subscription_presets to anon, authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.subscriptions,
  public.notification_preferences,
  public.subscription_notification_schedules,
  public.notification_logs
to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subscription_presets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.subscription_notification_schedules enable row level security;
alter table public.notification_logs enable row level security;

-- profiles: 본인 행만
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- subscription_presets: 공개 읽기 전용 (쓰기 정책 없음 = 거부)
create policy "subscription_presets_read_all" on public.subscription_presets
  for select to anon, authenticated using (true);

-- subscriptions: 본인 원장만
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "subscriptions_update_own" on public.subscriptions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "subscriptions_delete_own" on public.subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- notification_preferences: 본인 설정만
create policy "notification_preferences_select_own" on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notification_preferences_insert_own" on public.notification_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notification_preferences_update_own" on public.notification_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notification_preferences_delete_own" on public.notification_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);

-- subscription_notification_schedules: 본인 행 + 참조 구독도 본인 소유여야 함
create policy "notification_schedules_select_own" on public.subscription_notification_schedules
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notification_schedules_insert_own" on public.subscription_notification_schedules
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = (select auth.uid())
    )
  );
create policy "notification_schedules_update_own" on public.subscription_notification_schedules
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.subscriptions s
      where s.id = subscription_id and s.user_id = (select auth.uid())
    )
  );
create policy "notification_schedules_delete_own" on public.subscription_notification_schedules
  for delete to authenticated using ((select auth.uid()) = user_id);

-- notification_logs: 본인 행 + 참조 구독(있다면)도 본인 소유여야 함
create policy "notification_logs_select_own" on public.notification_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "notification_logs_insert_own" on public.notification_logs
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (
      subscription_id is null
      or exists (
        select 1 from public.subscriptions s
        where s.id = subscription_id and s.user_id = (select auth.uid())
      )
    )
  );
create policy "notification_logs_update_own" on public.notification_logs
  for update to authenticated using ((select auth.uid()) = user_id) with check (
    (select auth.uid()) = user_id
    and (
      subscription_id is null
      or exists (
        select 1 from public.subscriptions s
        where s.id = subscription_id and s.user_id = (select auth.uid())
      )
    )
  );
create policy "notification_logs_delete_own" on public.notification_logs
  for delete to authenticated using ((select auth.uid()) = user_id);
