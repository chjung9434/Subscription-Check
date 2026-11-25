-- 해지 경로 변경 제보 (소유: 다이렉트 해지 가이드 작업). 관리자 검토 화면은 범위 밖 — 서비스 롤로 조회한다.
create table public.cancellation_guide_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preset_id uuid references public.subscription_presets (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  service_name varchar(100) not null,
  report_reason varchar(30) not null check (report_reason in ('PATH_CHANGED', 'LINK_BROKEN', 'OTHER')),
  details text check (details is null or length(details) <= 500),
  status varchar(20) not null default 'PENDING' check (status in ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_guide_reports_preset on public.cancellation_guide_reports (preset_id);
create index idx_guide_reports_status on public.cancellation_guide_reports (status);
create index idx_guide_reports_user on public.cancellation_guide_reports (user_id, created_at desc);
create index idx_guide_reports_subscription on public.cancellation_guide_reports (subscription_id);

create trigger set_updated_at before update on public.cancellation_guide_reports
  for each row execute function public.handle_updated_at();

-- 사용자는 본인 제보 등록·조회만. 수정·삭제와 상태 변경은 운영(서비스 롤)에서만.
revoke all on table public.cancellation_guide_reports from anon, authenticated;
grant select, insert on table public.cancellation_guide_reports to authenticated;

alter table public.cancellation_guide_reports enable row level security;

create policy "Users can create their own guide reports" on public.cancellation_guide_reports
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and status = 'PENDING'
    and (
      subscription_id is null
      or exists (select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = (select auth.uid()))
    )
  );

create policy "Users can view their own guide reports" on public.cancellation_guide_reports
  for select to authenticated using ((select auth.uid()) = user_id);
