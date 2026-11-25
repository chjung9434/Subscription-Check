import { afterAll, describe, expect, it } from "vitest";
import { pool, runAs, SUB_A_NETFLIX, SUB_B_YOUTUBE, USER_A, USER_B } from "./db";

afterAll(async () => {
  await pool.end();
});

const report = (userId: string, subscriptionId: string | null, status = "PENDING") => ({
  text: `insert into public.cancellation_guide_reports (user_id, subscription_id, service_name, report_reason, status) values ($1, $2, '넷플릭스', 'PATH_CHANGED', $3) returning id`,
  values: [userId, subscriptionId, status],
});

const asA = { role: "authenticated", userId: USER_A } as const;

describe("cancellation_guide_reports access", () => {
  it("lets a user create and read only their own reports", async () => {
    await runAs(asA, async (db, { asAdmin }) => {
      await asAdmin(() => db.query(report(USER_B, SUB_B_YOUTUBE)));
      expect((await db.query(report(USER_A, SUB_A_NETFLIX))).rowCount).toBe(1);
      const { rows } = await db.query(`select user_id from public.cancellation_guide_reports`);
      expect(rows).toEqual([{ user_id: USER_A }]);
    });
  });

  it("rejects reports for another user or another user's subscription", async () => {
    await expect(runAs(asA, (db) => db.query(report(USER_B, null)))).rejects.toThrow(/row-level security/);
    await expect(runAs(asA, (db) => db.query(report(USER_A, SUB_B_YOUTUBE)))).rejects.toThrow(/row-level security/);
  });

  it("does not let users set a review status or edit/delete reports", async () => {
    await expect(runAs(asA, (db) => db.query(report(USER_A, null, "RESOLVED")))).rejects.toThrow(/row-level security/);
    await expect(runAs(asA, (db) => db.query(`update public.cancellation_guide_reports set status = 'RESOLVED'`))).rejects.toThrow(/permission denied/);
    await expect(runAs(asA, (db) => db.query(`delete from public.cancellation_guide_reports`))).rejects.toThrow(/permission denied/);
  });

  it("denies anonymous access", async () => {
    await expect(runAs({ role: "anon" }, (db) => db.query(`select * from public.cancellation_guide_reports`))).rejects.toThrow(/permission denied/);
  });
});
