import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  asServiceRole,
  createTestDb,
  createUser,
  migrationPath,
  type TestDb,
} from './helpers/test-db';

let db: TestDb;
let userId: string;
let stockId: string;

beforeAll(async () => {
  db = await createTestDb();
  userId = await createUser(db, 'owner@example.com');
  const stock = await db.query<{ id: string }>(
    `select id from public.stocks where symbol = 'CPALL'`,
  );
  stockId = stock.rows[0]!.id;
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe('migrations', () => {
  it('creates every table the design specifies', async () => {
    const result = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
        order by table_name`,
    );

    expect(result.rows.map((r) => r.table_name)).toEqual([
      'market_prices',
      'profiles',
      'stocks',
      'transactions',
    ]);
  });

  it('stores money and shares as numeric, never floating point', async () => {
    const result = await db.query<{ column_name: string; data_type: string }>(
      `select column_name, data_type from information_schema.columns
        where table_schema = 'public'
          and table_name in ('transactions', 'market_prices')
          and column_name in ('invested_amount', 'shares', 'price')
        order by column_name`,
    );

    expect(result.rows).toEqual([
      { column_name: 'invested_amount', data_type: 'numeric' },
      { column_name: 'price', data_type: 'numeric' },
      { column_name: 'shares', data_type: 'numeric' },
    ]);
  });

  it('exposes the latest price per stock through latest_market_prices', async () => {
    await asServiceRole(db, async () => {
      await db.query(
        `insert into public.market_prices (stock_id, price, provider, captured_at)
         values ($1, 60.00, 'mock', now() - interval '2 hours'),
                ($1, 65.25, 'mock', now())`,
        [stockId],
      );
    });

    const result = await db.query<{ symbol: string; price: string }>(
      `select symbol, price from public.latest_market_prices where symbol = 'CPALL'`,
    );

    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0]!.price)).toBe(65.25);
  });

  it('creates the indexes the dashboard and history queries rely on', async () => {
    const result = await db.query<{ indexname: string }>(
      `select indexname from pg_indexes
        where schemaname = 'public' and indexname like '%_idx'
        order by indexname`,
    );

    expect(result.rows.map((r) => r.indexname)).toEqual([
      'market_prices_stock_time_idx',
      'transactions_user_date_idx',
      'transactions_user_stock_idx',
    ]);
  });
});

describe('transaction constraints', () => {
  const insert = (amount: string, shares: string, date = '2026-08-09') =>
    db.query(
      `insert into public.transactions (user_id, stock_id, purchase_date, invested_amount, shares)
       values ($1, $2, $3, $4, $5)`,
      [userId, stockId, date, amount, shares],
    );

  it('accepts a valid purchase', async () => {
    await expect(insert('12500.00', '200')).resolves.toBeDefined();
  });

  it('rejects a non-positive invested amount', async () => {
    await expect(insert('0', '200')).rejects.toThrow(/transactions_invested_amount_positive/);
    await expect(insert('-1', '200')).rejects.toThrow(/transactions_invested_amount_positive/);
  });

  it('rejects a non-positive share count', async () => {
    await expect(insert('12500.00', '0')).rejects.toThrow(/transactions_shares_positive/);
    await expect(insert('12500.00', '-5')).rejects.toThrow(/transactions_shares_positive/);
  });

  it('rejects a purchase date in the future', async () => {
    await expect(insert('12500.00', '200', '2999-01-01')).rejects.toThrow(
      /transactions_purchase_date_not_future/,
    );
  });

  it('stamps updated_at on every update', async () => {
    const inserted = await db.query<{ id: string; updated_at: Date }>(
      `insert into public.transactions (user_id, stock_id, purchase_date, invested_amount, shares)
       values ($1, $2, '2026-08-01', 1000, 10) returning id, updated_at`,
      [userId, stockId],
    );
    const { id, updated_at: before } = inserted.rows[0]!;

    const updated = await db.query<{ updated_at: Date }>(
      `update public.transactions set invested_amount = 2000 where id = $1 returning updated_at`,
      [id],
    );

    expect(new Date(updated.rows[0]!.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });
});

describe('stock master constraints', () => {
  it('keeps V1 restricted to the Thai SET market', async () => {
    await expect(
      db.query(
        `insert into public.stocks (symbol, name_th, market) values ('AAPL', 'Apple', 'NASDAQ')`,
      ),
    ).rejects.toThrow(/stocks_market_set_only/);
  });

  it('rejects a lowercase symbol', async () => {
    await expect(
      db.query(`insert into public.stocks (symbol, name_th) values ('cpall', 'ทดสอบ')`),
    ).rejects.toThrow(/stocks_symbol_uppercase/);
  });

  it('rejects a duplicate symbol', async () => {
    await expect(
      db.query(`insert into public.stocks (symbol, name_th) values ('CPALL', 'ซ้ำ')`),
    ).rejects.toThrow(/stocks_symbol_key/);
  });
});

describe('market price constraints', () => {
  it('rejects a non-positive price', async () => {
    await expect(
      db.query(
        `insert into public.market_prices (stock_id, price, provider) values ($1, 0, 'mock')`,
        [stockId],
      ),
    ).rejects.toThrow(/market_prices_price_positive/);
  });
});

describe('stock master migration', () => {
  it('loads Thai SET stocks with Thai names', async () => {
    const result = await db.query<{ count: string }>(
      `select count(*)::text as count from public.stocks where market = 'SET'`,
    );

    expect(Number(result.rows[0]!.count)).toBeGreaterThanOrEqual(20);

    const cpall = await db.query<{ name_th: string }>(
      `select name_th from public.stocks where symbol = 'CPALL'`,
    );
    expect(cpall.rows[0]!.name_th).toContain('ซีพี ออลล์');
  });

  it('is idempotent', async () => {
    const before = await db.query<{ count: string }>(
      `select count(*)::text as count from public.stocks`,
    );

    // Re-applying must be harmless: a migration can be replayed on a database
    // that already holds the rows.
    const { readFile } = await import('node:fs/promises');
    await db.exec(await readFile(migrationPath('0004_seed_stocks.sql'), 'utf8'));

    const after = await db.query<{ count: string }>(
      `select count(*)::text as count from public.stocks`,
    );
    expect(after.rows[0]!.count).toBe(before.rows[0]!.count);
  });
});
