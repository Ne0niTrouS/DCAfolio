import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asServiceRole, createTestDb, createUser, type TestDb } from './helpers/test-db';

/**
 * What the Edge Functions are allowed to do.
 *
 * `service_role` bypasses RLS, which is easy to mistake for "can do anything".
 * It cannot: RLS and table privileges are separate mechanisms, and a role that
 * bypasses every policy still gets `42501 permission denied` without a GRANT.
 *
 * That is not hypothetical. `market-data` failed in production with exactly
 * that error while every policy was in place, and the app could only report
 * "could not read your data". These tests pin the privileges the two functions
 * actually depend on.
 */
describe('service_role privileges', () => {
  let db: TestDb;
  let stockId: string;

  beforeAll(async () => {
    db = await createTestDb();
    const userId = await createUser(db, 'owner@example.com');

    const stock = await db.query<{ id: string }>(
      "select id from public.stocks where symbol = 'CPALL'",
    );
    stockId = stock.rows[0]!.id;

    await db.query(
      `insert into public.transactions (user_id, stock_id, purchase_date, invested_amount, shares)
       values ($1, $2, current_date, 12500, 200)`,
      [userId, stockId],
    );
  });

  afterAll(async () => {
    await db.close();
  });

  /** Runs `sql` with the privileges of `service_role`, without bypassrls masking a missing grant. */
  async function asService<T>(work: () => Promise<T>): Promise<T> {
    await db.exec('set role service_role');
    try {
      return await work();
    } finally {
      await db.exec('reset role');
    }
  }

  it('reads the transactions the market-data function prices', async () => {
    await asService(async () => {
      const result = await db.query('select stock_id from public.transactions');
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  it('reads the stock master, which the same query embeds', async () => {
    // The function selects `stock_id, stocks ( id, symbol )`. A grant on
    // transactions alone leaves the embedded side failing.
    await asService(async () => {
      const result = await db.query('select id, symbol from public.stocks');
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  it('reads and writes the price cache', async () => {
    await asService(async () => {
      await db.query(
        `insert into public.market_prices (stock_id, price, provider, is_stale)
         values ($1, 40.25, 'yahoo', false)`,
        [stockId],
      );
      const result = await db.query('select price from public.market_prices');
      expect(result.rows).toHaveLength(1);
    });
  });

  it('cannot add to the stock master', async () => {
    // It could, for the `stock-admin` function, which let the browser add a
    // symbol. That function is gone and the register is read-only again: a
    // symbol arrives by migration, and migrations run as `postgres`.
    await asService(async () => {
      await expect(
        db.query(
          "insert into public.stocks (symbol, name_th, market) values ('TEST', 'ทดสอบ', 'SET')",
        ),
      ).rejects.toThrow(/permission denied/);
    });
  });

  it('is not given a way to delete a user record', async () => {
    // Least privilege: nothing either function does requires this, and a
    // service-role delete would bypass every policy protecting it.
    await asServiceRole(db, async () => {
      await db.exec('set role service_role');
      await expect(db.query('delete from public.transactions')).rejects.toThrow(
        /permission denied/,
      );
      await db.exec('reset role');
    });
  });

  it('is not given access to profiles', async () => {
    await asService(async () => {
      await expect(db.query('select * from public.profiles')).rejects.toThrow(
        /permission denied/,
      );
    });
  });
});
