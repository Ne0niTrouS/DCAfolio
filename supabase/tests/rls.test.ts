import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  asServiceRole,
  asUser,
  createTestDb,
  createUser,
  type TestDb,
} from './helpers/test-db';

let db: TestDb;
let alice: string;
let bob: string;
let stockId: string;
let aliceTransactionId: string;

beforeAll(async () => {
  db = await createTestDb();
  alice = await createUser(db, 'alice@example.com');
  bob = await createUser(db, 'bob@example.com');

  const stock = await db.query<{ id: string }>(
    `select id from public.stocks where symbol = 'CPALL'`,
  );
  stockId = stock.rows[0]!.id;

  await asServiceRole(db, async () => {
    const inserted = await db.query<{ id: string }>(
      `insert into public.transactions (user_id, stock_id, purchase_date, invested_amount, shares)
       values ($1, $2, '2026-08-09', 12500, 200) returning id`,
      [alice, stockId],
    );
    aliceTransactionId = inserted.rows[0]!.id;

    await db.query(
      `insert into public.market_prices (stock_id, price, provider) values ($1, 65.25, 'mock')`,
      [stockId],
    );
  });
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe('RLS — transactions are private to their owner', () => {
  it('lets the owner read their own transaction', async () => {
    const rows = await asUser(db, alice, () => db.query(`select id from public.transactions`));

    expect(rows.rows).toHaveLength(1);
  });

  it('hides another user’s transaction from SELECT', async () => {
    const rows = await asUser(db, bob, () => db.query(`select id from public.transactions`));

    expect(rows.rows).toHaveLength(0);
  });

  it('blocks UPDATE of another user’s transaction', async () => {
    const result = await asUser(db, bob, () =>
      db.query(`update public.transactions set invested_amount = 1 where id = $1`, [
        aliceTransactionId,
      ]),
    );

    expect(result.affectedRows).toBe(0);

    const untouched = await asServiceRole(db, () =>
      db.query<{ invested_amount: string }>(
        `select invested_amount from public.transactions where id = $1`,
        [aliceTransactionId],
      ),
    );
    expect(Number(untouched.rows[0]!.invested_amount)).toBe(12500);
  });

  it('blocks DELETE of another user’s transaction', async () => {
    const result = await asUser(db, bob, () =>
      db.query(`delete from public.transactions where id = $1`, [aliceTransactionId]),
    );

    expect(result.affectedRows).toBe(0);

    const stillThere = await asServiceRole(db, () =>
      db.query(`select id from public.transactions where id = $1`, [aliceTransactionId]),
    );
    expect(stillThere.rows).toHaveLength(1);
  });

  it('refuses an INSERT that claims another user’s id', async () => {
    await expect(
      asUser(db, bob, () =>
        db.query(
          `insert into public.transactions (user_id, stock_id, purchase_date, invested_amount, shares)
           values ($1, $2, '2026-08-10', 5000, 50)`,
          [alice, stockId],
        ),
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it('defaults user_id to the authenticated identity when the client omits it', async () => {
    await asUser(db, bob, () =>
      db.query(
        `insert into public.transactions (stock_id, purchase_date, invested_amount, shares)
         values ($1, '2026-08-11', 3000, 40)`,
        [stockId],
      ),
    );

    const bobRows = await asUser(db, bob, () =>
      db.query<{ user_id: string }>(`select user_id from public.transactions`),
    );

    expect(bobRows.rows).toHaveLength(1);
    expect(bobRows.rows[0]!.user_id).toBe(bob);
  });
});

describe('RLS — shared reference data', () => {
  it('lets any authenticated user read the stock master', async () => {
    const rows = await asUser(db, bob, () => db.query(`select id from public.stocks`));

    expect(rows.rows.length).toBeGreaterThan(0);
  });

  it('refuses a client write to the stock master', async () => {
    await expect(
      asUser(db, bob, () =>
        db.query(`insert into public.stocks (symbol, name_th) values ('TEST', 'ทดสอบ')`),
      ),
    ).rejects.toThrow(/permission denied|row-level security/i);
  });

  it('lets any authenticated user read cached market prices', async () => {
    const rows = await asUser(db, bob, () =>
      db.query(`select price from public.latest_market_prices`),
    );

    expect(rows.rows.length).toBeGreaterThan(0);
  });

  it('refuses a client write to the market price cache', async () => {
    await expect(
      asUser(db, bob, () =>
        db.query(
          `insert into public.market_prices (stock_id, price, provider) values ($1, 1, 'forged')`,
          [stockId],
        ),
      ),
    ).rejects.toThrow(/permission denied|row-level security/i);
  });
});

describe('RLS — profiles', () => {
  it('lets a user create and read only their own profile', async () => {
    await asUser(db, alice, () =>
      db.query(`insert into public.profiles (user_id, display_name) values ($1, 'Alice')`, [
        alice,
      ]),
    );

    const aliceRows = await asUser(db, alice, () =>
      db.query(`select display_name from public.profiles`),
    );
    expect(aliceRows.rows).toHaveLength(1);

    const bobRows = await asUser(db, bob, () =>
      db.query(`select display_name from public.profiles`),
    );
    expect(bobRows.rows).toHaveLength(0);
  });

  it('refuses a profile row created for someone else', async () => {
    await expect(
      asUser(db, bob, () =>
        db.query(`insert into public.profiles (user_id, display_name) values ($1, 'not bob')`, [
          alice,
        ]),
      ),
    ).rejects.toThrow(/row-level security/i);
  });
});
