# 구독체크 배포 체크리스트 (대시보드 방식)

Vercel(Hobby)과 Supabase 대시보드에서 직접 진행하는 순서입니다. 위에서부터 차례로 체크하세요.
비밀값(키·비밀번호·시크릿)은 각 서비스의 설정 화면에만 입력하고, 채팅·저장소·메신저에 붙여넣지 마세요.

준비물: 이 GitHub 저장소(`chjung9434/subscription-check`) 접근 권한, Vercel 계정, Supabase 계정, 로컬 터미널(Node.js 20 이상) 1회 사용.

---

## 1단계. 비밀값 2종 만들기 (로컬 터미널, 1회)

- [ ] **크론 시크릿** 생성 — 출력값을 안전한 곳(비밀번호 관리자)에 보관

  ```bash
  openssl rand -hex 32
  ```

- [ ] **웹 푸시 VAPID 키** 생성 — `Public Key`, `Private Key` 두 값을 보관

  ```bash
  npx -y web-push@4.0.0 generate-vapid-keys
  ```

## 2단계. Supabase 운영 프로젝트 만들기

- [ ] supabase.com → **New project**
  - Name: `subscription-check` (자유)
  - Database Password: 강한 비밀번호 생성 후 보관 (앱 설정에는 쓰지 않음)
  - Region: **Northeast Asia (Seoul)**
- [ ] 프로젝트 생성 완료(상태 Healthy)까지 대기

## 3단계. 데이터베이스 마이그레이션 적용 (SQL Editor)

Supabase 대시보드 → **SQL Editor** → New query. 아래 4개 파일을 **이 순서대로 하나씩** 저장소에서 열어 전체 내용을 붙여넣고 **Run** 합니다. 각 실행이 `Success`인지 확인한 뒤 다음 파일로 넘어가세요.

- [ ] 1. `supabase/migrations/20261126000000_init_core_schema.sql` — 테이블·RLS·트리거
- [ ] 2. `supabase/migrations/20261126010000_seed_subscription_presets.sql` — 인기 서비스 프리셋 30종
- [ ] 3. `supabase/migrations/20261126020000_push_subscriptions.sql` — 웹 푸시 기기
- [ ] 4. `supabase/migrations/20261126030000_cancellation_guide_reports.sql` — 해지 가이드 제보

`supabase/seed.sql`은 로컬 테스트 전용입니다. **운영에서는 실행하지 마세요.**

- [ ] 적용 확인 — 새 쿼리에 붙여넣고 Run

  ```sql
  select
    (select count(*) from pg_class
      where relnamespace = 'public'::regnamespace and relkind = 'r' and relrowsecurity
        and relname in ('profiles','subscription_presets','subscriptions','notification_preferences',
                        'subscription_notification_schedules','notification_logs','push_subscriptions',
                        'cancellation_guide_reports')) as rls_tables,
    (select count(*) from public.subscription_presets) as presets;
  ```

  결과가 `rls_tables = 8`, `presets = 30` 이면 정상입니다.

## 4단계. Supabase 키 확인

Supabase 대시보드 → **Project Settings → API Keys** (또는 Data API) 에서 아래 3가지를 확인합니다.

- [ ] Project URL (`https://<ref>.supabase.co`)
- [ ] 공개 키: **publishable** 키(`sb_publishable_…`) 또는 legacy **anon** 키
- [ ] 서버 전용 키: **secret** 키(`sb_secret_…`) 또는 legacy **service_role** 키 — 절대 공개하지 마세요

## 5단계. Vercel 프로젝트 만들기

- [ ] vercel.com → **Add New… → Project** → GitHub에서 `chjung9434/subscription-check` **Import**
  - GitHub 연결 권한 요청이 나오면 이 저장소에 대한 접근을 허용
- [ ] Project Name 확인 (예: `subscription-check`) — 배포 주소가 `https://<Project Name>.vercel.app` 형태가 됩니다
- [ ] Framework Preset: **Next.js** (자동 인식), Build/Output 설정은 기본값 유지
- [ ] Production Branch: 저장소 기본 브랜치(현재 `claude/busy-ptolemy-qgl0dd`). 나중에 `main` 등으로 바꾸면 Vercel Settings → Git 에서도 맞춰 주세요.
- [ ] **Environment Variables** 에 아래 값 입력 (Environment: Production. Preview도 쓰려면 함께 체크)

  | Name | Value |
  |---|---|
  | `NEXT_PUBLIC_APP_URL` | `https://<Project Name>.vercel.app` (끝에 `/` 없이) |
  | `NEXT_PUBLIC_TIMEZONE` | `Asia/Seoul` |
  | `NEXT_PUBLIC_SUPABASE_URL` | 4단계 Project URL |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 4단계 공개 키 |
  | `SUPABASE_SERVICE_ROLE_KEY` | 4단계 서버 전용 키 |
  | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 1단계 VAPID Public Key |
  | `VAPID_PRIVATE_KEY` | 1단계 VAPID Private Key |
  | `VAPID_SUBJECT` | `mailto:<운영 연락 이메일>` |
  | `CRON_SECRET` | 1단계 크론 시크릿 |

  `PUSH_TEST_ENDPOINT_ORIGIN`은 로컬 검증 전용이므로 **넣지 마세요.** Google/Kakao 키는 소셜 로그인을 켤 때(9단계) 추가합니다.
- [ ] **Deploy** 클릭 → 빌드 성공 확인
- [ ] 실제 배포 주소가 `NEXT_PUBLIC_APP_URL`과 다르면(이름이 이미 사용 중이었던 경우 등): Settings → Environment Variables 에서 값을 실제 주소로 고치고 **Deployments → 최신 배포 → Redeploy** (`NEXT_PUBLIC_` 값은 빌드 시 반영되므로 재배포가 필요합니다)

## 6단계. Supabase 인증 URL 설정

Supabase 대시보드 → **Authentication → URL Configuration**

- [ ] Site URL: `https://<배포 주소>`
- [ ] Redirect URLs 에 추가: `https://<배포 주소>/auth/callback`
  - 커스텀 도메인을 붙이면 그 주소도 같은 방식으로 추가

Authentication → **Sign In / Providers → Email**

- [ ] Email 로그인 켜짐 확인
- [ ] "Confirm email"을 켜면 가입 시 확인 메일 링크를 눌러야 로그인됩니다 (앱이 안내 문구를 표시함). 메일 발송 설정(9단계) 전에는 끄는 것을 권장

## 7단계. 예약 알림 크론 (GitHub Actions)

GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**

- [ ] `APP_URL` = `https://<배포 주소>` (끝에 `/` 없이)
- [ ] `CRON_SECRET` = 1단계 크론 시크릿 (Vercel 값과 동일)
- [ ] **Actions** 탭 → `Dispatch payment reminders` → **Run workflow** → 실행 결과가 초록색(성공)이고 로그에 `"success":true`가 보이는지 확인
  - 이후 10분마다 자동 실행됩니다 (GitHub 사정으로 몇 분 늦을 수 있음)

## 8단계. 배포 확인

- [ ] 헬스 체크: 브라우저 또는 터미널에서

  ```bash
  curl -i https://<배포 주소>/api/health
  ```

  `200` 과 `"status":"healthy"`, `"database":"connected"`, `"timezone":"Asia/Seoul"` 이 보이면 정상.
  `503` 이면 `error` 값을 확인: `ENV_INVALID`(Vercel 환경 변수 누락·오타) / `DATABASE_UNAVAILABLE`(Supabase URL·키 확인) / `PRESETS_MISSING`(3단계 2번 파일 미적용)
- [ ] 같은 응답 헤더에 `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` 확인
- [ ] 휴대폰 브라우저로 배포 주소 접속 → `/auth/login` 으로 이동하는지 확인
- [ ] 이메일로 회원가입 → 홈 대시보드 표시
- [ ] 구독 1건 등록(프리셋 선택) → 목록·캘린더·홈 금액에 반영
- [ ] 알림 탭 → **알림 켜기** → 권한 허용 → **테스트 알림 발송** → 휴대폰/PC에 알림 도착
  - iPhone은 Safari 공유 메뉴의 "홈 화면에 추가" 후 홈 화면 앱에서 진행해야 합니다
- [ ] 테스트 계정은 설정 → 회원 탈퇴로 정리 (선택)
- [ ] 문제가 있으면 Vercel → Project → **Logs** 에서 `[env]`, `[health]`, `[auth]`, `[dispatch]` 로그 확인

배포 주소를 알려주시면 헬스 체크·보안 헤더·로그인 화면은 원격으로도 확인해 드릴 수 있습니다.

## 9단계. 출시 전 선택 설정

- [ ] **메일 발송(SMTP)**: Supabase → Authentication → **SMTP Settings** 에 메일 서비스(예: Resend, SendGrid) 연결 — 기본 발송은 시간당 몇 통으로 제한되어 비밀번호 재설정·가입 확인 메일이 막힐 수 있습니다
- [ ] **메일 템플릿 한국어화**: Authentication → **Email Templates** 의 "Reset Password", "Confirm signup" 제목·본문을 한국어로 수정 (링크 변수 `{{ .ConfirmationURL }}`는 유지)
- [ ] **Google 로그인**: Google Cloud Console에서 OAuth 클라이언트 생성 → 승인된 리디렉션 URI에 `https://<ref>.supabase.co/auth/v1/callback` 등록 → Supabase → Authentication → Providers → Google 켜고 Client ID/Secret 입력 → Vercel 환경 변수에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 추가 후 Redeploy
- [ ] **Kakao 로그인**: Kakao Developers에서 앱 생성 → 카카오 로그인 활성화, Redirect URI에 `https://<ref>.supabase.co/auth/v1/callback` 등록 → Supabase Providers → Kakao 켜고 REST API 키/Client Secret 입력 → Vercel에 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` 추가 후 Redeploy
- [ ] 네이버 로그인은 현재 "소셜 로그인 설정 준비 중" 안내만 표시합니다 (결정 사항)
- [ ] 커스텀 도메인: Vercel → Settings → Domains 에서 연결 후, `NEXT_PUBLIC_APP_URL`·Supabase Site URL/Redirect URLs·GitHub `APP_URL` 을 새 주소로 바꾸고 Redeploy
