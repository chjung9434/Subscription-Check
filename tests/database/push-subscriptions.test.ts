import { afterAll, describe, expect, it } from "vitest";
import { pool, runAs, USER_A, USER_B } from "./db";

afterAll(async () => {
  await pool.end();
});

const insertDevice = (userId: string, endpoint: string) => ({
  text: `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, 'p', 'a') returning id`,
  values: [userId, endpoint],
});

describe("push_subscriptions isolation", () => {
  it("lets users manage only their own devices", async () => {
    await runAs({ role: "authenticated", userId: USER_A }, async (db, { asAdmin }) => {
      await asAdmin(() => db.query(insertDevice(USER_B, "https://fcm.googleapis.com/fcm/send/b-device")));
      const own = await db.query(insertDevice(USER_A, "https://fcm.googleapis.com/fcm/send/a-device"));
      expect(own.rowCount).toBe(1);

      const visible = await db.query(`select endpoint from public.push_subscriptions`);
      expect(visible.rows).toEqual([{ endpoint: "https://fcm.googleapis.com/fcm/send/a-device" }]);

      const stolen = await db.query(`update public.push_subscriptions set user_id = $1 where endpoint like '%b-device'`, [USER_A]);
      const removed = await db.query(`delete from public.push_subscriptions where endpoint like '%b-device'`);
      expect([stolen.rowCount, removed.rowCount]).toEqual([0, 0]);
    });
  });

  it("rejects registering a device for another user", async () => {
    await expect(
      runAs({ role: "authenticated", userId: USER_A }, (db) => db.query(insertDevice(USER_B, "https://fcm.googleapis.com/fcm/send/x"))),
    ).rejects.toThrow(/row-level security/);
  });

  it("denies anonymous access", async () => {
    await expect(runAs({ role: "anon" }, (db) => db.query(`select * from public.push_subscriptions`))).rejects.toThrow(/permission denied/);
  });

  it("is removed with the account", async () => {
    await runAs({ role: "anon" }, async (db, { asAdmin }) => {
      await asAdmin(async () => {
        await db.query(insertDevice(USER_A, "https://fcm.googleapis.com/fcm/send/gone"));
        await db.query(`delete from auth.users where id = $1`, [USER_A]);
        const { rows } = await db.query(`select count(*)::int as n from public.push_subscriptions where user_id = $1`, [USER_A]);
        expect(rows[0].n).toBe(0);
      });
    });
  });
});
