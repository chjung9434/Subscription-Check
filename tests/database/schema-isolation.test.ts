import { afterAll, describe, expect, it } from "vitest";
import { pool, runAs, SUB_A_NETFLIX, SUB_B_YOUTUBE, USER_A, USER_B } from "./db";

afterAll(async () => {
  await pool.end();
});

const asA = { role: "authenticated", userId: USER_A } as const;
const asB = { role: "authenticated", userId: USER_B } as const;
const anon = { role: "anon" } as const;

const newSubscription = (userId: string, overrides: Record<string, unknown> = {}) => {
  const row = {
    user_id: userId,
    service_name: "테스트 구독",
    category: "기타",
    amount: 1000,
    currency: "KRW",
    billing_cycle: "MONTHLY",
    billing_day: 1,
    next_billing_date: "2026-12-01",
    payment_method_memo: null,
    ...overrides,
  };
  const columns = Object.keys(row);
  return {
    text: `insert into public.subscriptions (${columns.join(", ")}) values (${columns.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
    values: Object.values(row),
  };
};

describe("schema", () => {
  it("creates every table with row level security enabled", async () => {
    const { rows } = await pool.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`,
    );
    expect(rows).toEqual(
      [
        "notification_logs",
        "notification_preferences",
        "profiles",
        "push_subscriptions",
        "subscription_notification_schedules",
        "subscription_presets",
        "subscriptions",
      ].map((relname) => ({ relname, relrowsecurity: true })),
    );
  });

  it("stores next_billing_date as a plain date", async () => {
    const { rows } = await pool.query(
      `select data_type from information_schema.columns where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'next_billing_date'`,
    );
    expect(rows[0]?.data_type).toBe("date");
  });

  it("does not let API roles execute the trigger functions", async () => {
    const { rows } = await pool.query(
      `select has_function_privilege('authenticated', 'public.handle_new_user()', 'execute') as auth_new_user,
              has_function_privilege('anon', 'public.handle_new_user()', 'execute') as anon_new_user`,
    );
    expect(rows[0]).toEqual({ auth_new_user: false, anon_new_user: false });
  });

  it("creates a profile and default notification preferences on sign-up", async () => {
    await runAs(anon, async (db, { asAdmin }) => {
      await asAdmin(async () => {
        const id = "00000000-0000-0000-0000-0000000000ff";
        await db.query(
          `insert into auth.users (instance_id, id, aud, role, email) values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', 'new@example.com')`,
          [id],
        );
        const profile = await db.query(`select email from public.profiles where id = $1`, [id]);
        const prefs = await db.query(`select remind_days, dispatch_time, is_enabled from public.notification_preferences where user_id = $1`, [id]);
        expect(profile.rows).toEqual([{ email: "new@example.com" }]);
        expect(prefs.rows).toEqual([{ remind_days: [3], dispatch_time: "08:00:00", is_enabled: true }]);
      });
    });
  });
});

describe("seed", () => {
  it("loads the 30 presets and multi-currency, monthly/yearly samples", async () => {
    const presets = await pool.query(`select count(*)::int as n from public.subscription_presets`);
    expect(presets.rows[0].n).toBe(30);
    const samples = await pool.query(
      `select distinct currency::text, billing_cycle::text from public.subscriptions where user_id = $1 order by 1, 2`,
      [USER_A],
    );
    expect(samples.rows).toEqual([
      { currency: "KRW", billing_cycle: "MONTHLY" },
      { currency: "KRW", billing_cycle: "YEARLY" },
      { currency: "USD", billing_cycle: "MONTHLY" },
    ]);
    const endOfMonth = await pool.query(`select count(*)::int as n from public.subscriptions where billing_day = 31`);
    expect(endOfMonth.rows[0].n).toBeGreaterThan(0);
  });
});

describe("anonymous access", () => {
  it("can read presets", async () => {
    const { rows } = await runAs(anon, (db) => db.query(`select service_name from public.subscription_presets`));
    expect(rows).toHaveLength(30);
  });

  it("cannot read or write user data", async () => {
    await expect(runAs(anon, (db) => db.query(`select * from public.subscriptions`))).rejects.toThrow(/permission denied/);
    await expect(runAs(anon, (db) => db.query(newSubscription(USER_A)))).rejects.toThrow(/permission denied/);
    await expect(runAs(anon, (db) => db.query(`select * from public.notification_preferences`))).rejects.toThrow(/permission denied/);
  });

  it("cannot change presets", async () => {
    await expect(runAs(anon, (db) => db.query(`delete from public.subscription_presets`))).rejects.toThrow(/permission denied/);
  });
});

describe("tenant isolation", () => {
  it("returns only the caller's rows from every user table", async () => {
    await runAs(asA, async (db) => {
      for (const table of ["subscriptions", "notification_preferences", "subscription_notification_schedules", "notification_logs"]) {
        const { rows } = await db.query<{ user_id: string }>(`select user_id from public.${table}`);
        expect(rows.length, table).toBeGreaterThan(0);
        expect(rows.every((row) => row.user_id === USER_A), table).toBe(true);
      }
      const profiles = await db.query(`select id from public.profiles`);
      expect(profiles.rows).toEqual([{ id: USER_A }]);
    });
    await runAs(asB, async (db) => {
      const { rows } = await db.query(`select id from public.subscriptions order by id`);
      expect(rows.map((row) => row.id)).toEqual([SUB_B_YOUTUBE, "20000000-0000-0000-0000-000000000002"]);
    });
  });

  it("cannot see another user's subscription by id", async () => {
    const { rows } = await runAs(asA, (db) => db.query(`select id from public.subscriptions where id = $1`, [SUB_B_YOUTUBE]));
    expect(rows).toHaveLength(0);
  });

  it("cannot update or delete another user's subscription", async () => {
    await runAs(asA, async (db, { asAdmin }) => {
      const updated = await db.query(`update public.subscriptions set amount = 0 where id = $1`, [SUB_B_YOUTUBE]);
      const deleted = await db.query(`delete from public.subscriptions where id = $1`, [SUB_B_YOUTUBE]);
      const prefs = await db.query(`update public.notification_preferences set is_enabled = false where user_id = $1`, [USER_B]);
      expect([updated.rowCount, deleted.rowCount, prefs.rowCount]).toEqual([0, 0, 0]);
      await asAdmin(async () => {
        const { rows } = await db.query(`select amount from public.subscriptions where id = $1`, [SUB_B_YOUTUBE]);
        expect(rows).toEqual([{ amount: "14900.00" }]);
      });
    });
  });

  it("cannot create rows for another user or move own rows to another user", async () => {
    await expect(runAs(asA, (db) => db.query(newSubscription(USER_B)))).rejects.toThrow(/row-level security/);
    await expect(
      runAs(asA, (db) => db.query(`update public.subscriptions set user_id = $1 where id = $2`, [USER_B, SUB_A_NETFLIX])),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot attach schedules or logs to another user's subscription", async () => {
    await expect(
      runAs(asA, (db) =>
        db.query(
          `insert into public.subscription_notification_schedules (subscription_id, user_id, target_date, days_before, scheduled_at, idempotency_key)
           values ($1, $2, '2026-12-10', 1, now(), 'cross-tenant')`,
          [SUB_B_YOUTUBE, USER_A],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      runAs(asA, (db) =>
        db.query(`insert into public.notification_logs (user_id, subscription_id, title, body) values ($1, $2, 't', 'b')`, [USER_A, SUB_B_YOUTUBE]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("can manage own subscriptions", async () => {
    await runAs(asA, async (db) => {
      const inserted = await db.query(newSubscription(USER_A, { payment_method_memo: "현대 제로카드 1234" }));
      expect(inserted.rowCount).toBe(1);
      const updated = await db.query(`update public.subscriptions set status = 'PAUSED' where id = $1`, [SUB_A_NETFLIX]);
      expect(updated.rowCount).toBe(1);
    });
  });

  it("cannot write presets as a signed-in user", async () => {
    await expect(
      runAs(asA, (db) =>
        db.query(
          `insert into public.subscription_presets (service_name, category, cancellation_guide_text, cancellation_official_url) values ('x', 'x', 'x', 'https://x.example')`,
        ),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("constraints", () => {
  const rejects = (overrides: Record<string, unknown>, pattern: RegExp) =>
    expect(runAs(asA, (db) => db.query(newSubscription(USER_A, overrides)))).rejects.toThrow(pattern);

  it("rejects a payment method memo longer than 50 characters", () => rejects({ payment_method_memo: "가".repeat(51) }, /too long/));
  it("rejects a card-number-like payment method memo", () => rejects({ payment_method_memo: "1234-5678-9012-3456" }, /check constraint/));
  it("rejects a negative amount", () => rejects({ amount: -1000 }, /check constraint/));
  it("rejects a billing day outside 1-31", () => rejects({ billing_day: 32 }, /check constraint/));
  it("rejects an unsupported currency", () => rejects({ currency: "EUR" }, /invalid input value for enum/));
  it("rejects alert days other than 1, 3, 7", () => rejects({ custom_alert_days: [2] }, /check constraint/));
  it("requires alert days when custom alerts are on", () => rejects({ use_custom_alert: true }, /subscriptions_custom_alert_days_required/));
});
