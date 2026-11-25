import { Pool, type PoolClient } from "pg";

// 로컬 전용. 연결 대상이 로컬 호스트가 아니면 테스트를 시작하지 않는다.
const DEFAULT_LOCAL_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const url = process.env.TEST_DATABASE_URL ?? DEFAULT_LOCAL_URL;
const host = new URL(url).hostname;
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error(`DB 테스트는 로컬 데이터베이스에서만 실행합니다 (현재 호스트: ${host}).`);
}

export const pool = new Pool({ connectionString: url, max: 2 });

export const USER_A = "00000000-0000-0000-0000-000000000001";
export const USER_B = "00000000-0000-0000-0000-000000000002";
export const SUB_A_NETFLIX = "10000000-0000-0000-0000-000000000001";
export const SUB_B_YOUTUBE = "20000000-0000-0000-0000-000000000001";

type Actor = { role: "anon" } | { role: "authenticated"; userId: string };

/**
 * 트랜잭션 안에서 API 역할(anon/authenticated)과 JWT 클레임을 흉내 내어 실행하고 항상 롤백한다.
 * `asAdmin`으로 같은 트랜잭션 안에서 postgres 권한으로 상태를 확인할 수 있다.
 */
export async function runAs<T>(
  actor: Actor,
  fn: (db: PoolClient, helpers: { asAdmin: <R>(inner: () => Promise<R>) => Promise<R> }) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  const claims = actor.role === "anon" ? { role: "anon" } : { role: "authenticated", sub: actor.userId };
  const enter = async () => {
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
    await client.query(`set local role ${actor.role}`);
  };
  try {
    await client.query("begin");
    await enter();
    return await fn(client, {
      asAdmin: async (inner) => {
        await client.query("reset role");
        try {
          return await inner();
        } finally {
          await enter();
        }
      },
    });
  } finally {
    await client.query("rollback");
    client.release();
  }
}
