// 배포 전 DB 점검: 필수 테이블·RLS·프리셋 30종·마이그레이션 적용 여부 (읽기 전용 쿼리만 실행)
// 사용: DATABASE_URL=postgresql://... npm run db:verify
import { readdirSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL이 필요합니다.");
  process.exit(2);
}

const REQUIRED_TABLES = [
  "profiles",
  "subscription_presets",
  "subscriptions",
  "notification_preferences",
  "subscription_notification_schedules",
  "notification_logs",
  "push_subscriptions",
  "cancellation_guide_reports",
];

const client = new pg.Client({ connectionString: url });
const failures = [];
try {
  await client.connect();
  await client.query("begin read only");
  const { rows: tables } = await client.query(
    `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relname = any($1)`,
    [REQUIRED_TABLES],
  );
  for (const name of REQUIRED_TABLES) {
    const table = tables.find((row) => row.relname === name);
    if (!table) failures.push(`테이블 없음: ${name}`);
    else if (!table.relrowsecurity) failures.push(`RLS 꺼짐: ${name}`);
  }
  const { rows: policies } = await client.query(`select tablename, count(*)::int as n from pg_policies where schemaname = 'public' group by tablename`);
  for (const name of REQUIRED_TABLES) {
    if (!policies.some((row) => row.tablename === name && row.n > 0)) failures.push(`RLS 정책 없음: ${name}`);
  }
  const { rows: presets } = await client.query(`select count(*)::int as n from public.subscription_presets`).catch(() => ({ rows: [{ n: 0 }] }));
  if (presets[0].n < 30) failures.push(`프리셋 ${presets[0].n}종 (30종 필요)`);

  const local = readdirSync(new URL("../supabase/migrations/", import.meta.url)).filter((file) => file.endsWith(".sql")).map((file) => file.split("_")[0]);
  const { rows: applied } = await client
    .query(`select version from supabase_migrations.schema_migrations`)
    .catch(() => ({ rows: null }));
  if (applied === null) failures.push("supabase_migrations.schema_migrations를 읽을 수 없음 (supabase db push로 적용했는지 확인)");
  else for (const version of local) if (!applied.some((row) => row.version === version)) failures.push(`마이그레이션 미적용: ${version}`);
  await client.query("rollback");
} catch (error) {
  failures.push(`DB 연결/조회 실패: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await client.end().catch(() => {});
}

if (failures.length > 0) {
  console.error("DB 점검 실패:\n" + failures.map((line) => ` - ${line}`).join("\n"));
  process.exit(1);
}
console.log(`DB 점검 통과: 테이블 ${REQUIRED_TABLES.length}개 RLS 활성·정책 있음, 프리셋 30종, 마이그레이션 모두 적용`);
