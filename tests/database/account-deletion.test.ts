import { afterAll, describe, expect, it } from "vitest";
import { pool, runAs, USER_A, USER_B } from "./db";

afterAll(async () => {
  await pool.end();
});

const USER_TABLES = [
  ["profiles", "id"],
  ["subscriptions", "user_id"],
  ["notification_preferences", "user_id"],
  ["subscription_notification_schedules", "user_id"],
  ["notification_logs", "user_id"],
] as const;

async function countRows(db: { query: typeof pool.query }, userId: string) {
  const counts: Record<string, number> = {};
  for (const [table, column] of USER_TABLES) {
    const { rows } = await db.query(`select count(*)::int as n from public.${table} where ${column} = $1`, [userId]);
    counts[table] = rows[0].n;
  }
  return counts;
}

describe("account deletion", () => {
  it("hard-deletes every row of the user when auth.users is deleted, leaving others intact", async () => {
    await runAs({ role: "anon" }, async (db, { asAdmin }) => {
      await asAdmin(async () => {
        const before = await countRows(db, USER_A);
        expect(Object.values(before).every((n) => n > 0)).toBe(true);
        const otherBefore = await countRows(db, USER_B);

        await db.query(`delete from auth.users where id = $1`, [USER_A]);

        expect(await countRows(db, USER_A)).toEqual(Object.fromEntries(USER_TABLES.map(([table]) => [table, 0])));
        expect(await countRows(db, USER_B)).toEqual(otherBefore);
      });
    });
  });
});
