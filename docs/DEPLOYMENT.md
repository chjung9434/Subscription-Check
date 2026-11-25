# 구독체크 운영 배포 가이드

표준 Next.js(Node.js) 서버로 빌드·실행합니다. 특정 호스팅에 묶이지 않으며, Vercel·Render·Fly.io·자체 서버 어디서나 같은 절차입니다.

## 1. Supabase 운영 프로젝트

1. Supabase에서 새 프로젝트를 만들고 리전은 서울(ap-northeast-2)을 권장합니다.
2. 이 저장소에서 프로젝트를 연결하고 마이그레이션을 적용합니다.

   ```bash
   npx supabase link --project-ref <프로젝트 ref>
   npx supabase db push
   ```

   `supabase/migrations`의 모든 파일(핵심 스키마, 인기 서비스 프리셋 30종, 푸시 구독, 해지 가이드 제보)이 적용됩니다. `supabase/seed.sql`은 로컬 테스트 전용이므로 운영에 넣지 않습니다.
3. 적용 상태를 점검합니다 (읽기 전용 쿼리만 실행).

   ```bash
   DATABASE_URL="<운영 DB 연결 문자열>" npm run db:verify
   ```

4. Authentication 설정
   - Site URL: 운영 주소 (예: `https://app.example.com`)
   - Redirect URLs: `https://app.example.com/auth/callback`
   - 이메일 발송(SMTP): 비밀번호 재설정·가입 확인 메일에 필요합니다. 기본 발송은 시간당 제한이 매우 낮으므로 운영 SMTP를 연결하세요.
   - 소셜 로그인: Google·Kakao 제공자를 켜고 각 개발자 콘솔의 Redirect URI에 `https://<프로젝트 ref>.supabase.co/auth/v1/callback`을 등록합니다. 네이버는 Supabase 기본 제공자가 아니어서 현재 앱에서 안내 모달만 표시됩니다.

## 2. 환경 변수

`.env.example`의 이름을 기준으로 호스팅의 환경 변수 설정에 넣습니다. 값은 저장소에 커밋하지 마세요.

| 이름 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | 필수 | 운영 주소 (리다이렉트 기준) |
| `NEXT_PUBLIC_TIMEZONE` | 필수 | 반드시 `Asia/Seoul` |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | 공개(anon/publishable) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 | 서버 전용 비밀 키 (회원 탈퇴·알림 발송) |
| `GOOGLE_CLIENT_ID`/`_SECRET`, `KAKAO_CLIENT_ID`/`_SECRET` | 선택 | 설정된 제공자만 소셜 로그인 버튼이 동작 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | 선택 | 웹 푸시 알림. 없으면 알림 기능이 꺼짐 |
| `CRON_SECRET` | 선택 | 예약 알림 발송 엔드포인트 인증. 없으면 발송 안 됨 |
| `DATABASE_URL` | 선택 | `npm run db:verify` 점검용 |
| `PUSH_TEST_ENDPOINT_ORIGIN` | 비움 | 로컬 검증 전용. 운영에서는 설정하지 않음 |

필수 값이 없거나 잘못되면 서버가 시작 단계에서 `[env]` 로그를 남기고 요청을 받지 않습니다 (값은 로그에 남지 않음).

VAPID 키 생성:

```bash
node --input-type=module -e "import {generateVAPIDKeys} from 'web-push'; console.log(generateVAPIDKeys())"
```

## 3. 빌드·실행

```bash
npm ci
npm run predeploy:check
npm run start
```

`predeploy:check`는 타입 검사, 린트, 단위 테스트, 프로덕션 빌드를 순서대로 실행합니다.

## 4. 예약 알림 크론

10분마다 아래 엔드포인트를 호출하도록 크론을 등록합니다 (GET·POST 모두 허용).

```bash
curl -X POST https://app.example.com/api/v1/notifications/dispatch -H "Authorization: Bearer $CRON_SECRET"
```

## 5. 배포 후 확인

```bash
curl -i https://app.example.com/api/health
```

- 200 + `{"status":"healthy","database":"connected","timezone":"Asia/Seoul"}` 이면 정상입니다.
- 503 + `error` 코드(`ENV_INVALID`, `DATABASE_UNAVAILABLE`, `PRESETS_MISSING`)면 해당 항목을 점검합니다.
- 응답 헤더에 `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`가 있는지 확인합니다.
- 브라우저에서 `/` → `/home` → (비로그인 시) `/auth/login` 이동, 가입·로그인을 확인합니다.
