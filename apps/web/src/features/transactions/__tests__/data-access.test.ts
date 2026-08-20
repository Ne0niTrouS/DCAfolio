import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupabaseMock, type RecordedCall } from '@/test/supabase-mock';

const state = vi.hoisted(() => ({
  mock: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return state.mock!.supabase;
  },
}));

const { fetchStocks, fetchTransactions } = await import('../queries');
const { createTransaction, deleteTransaction, updateTransaction } =
  await import('../mutations');
const { mapTransaction } = await import('../mappers');

function useMock(result: { data?: unknown; error?: unknown } = {}) {
  state.mock = createSupabaseMock(result);
  return state.mock;
}

function lastCall(calls: RecordedCall[]): RecordedCall {
  return calls[calls.length - 1]!;
}

const ROW = {
  id: 'tx-1',
  user_id: 'user-1',
  stock_id: 'stock-cpall',
  purchase_date: '2026-08-09',
  invested_amount: '12500.00',
  shares: '200.0000',
  created_at: '2026-08-09T10:00:00.000Z',
  updated_at: '2026-08-09T10:00:00.000Z',
  stocks: {
    id: 'stock-cpall',
    symbol: 'CPALL',
    name_th: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    market: 'SET',
    is_active: true,
  },
};

beforeEach(() => {
  useMock({ data: [ROW] });
});

describe('mapTransaction', () => {
  it('keeps money and shares as decimal strings', () => {
    const transaction = mapTransaction(ROW);

    expect(transaction.investedAmount).toBe('12500.00');
    expect(transaction.shares).toBe('200.0000');
    expect(transaction.stock.symbol).toBe('CPALL');
    expect(transaction.stock.nameTh).toContain('ซีพี ออลล์');
  });

  it('normalises a numeric response without losing the value', () => {
    const transaction = mapTransaction({ ...ROW, invested_amount: 12500, shares: 200 });

    expect(transaction.investedAmount).toBe('12500');
    expect(transaction.shares).toBe('200');
  });

  it('degrades rather than crashing when the stock join is empty', () => {
    const transaction = mapTransaction({ ...ROW, stocks: null });

    expect(transaction.stock.id).toBe('stock-cpall');
    expect(transaction.stock.symbol).toBe('—');
  });
});

describe('fetchTransactions', () => {
  it('casts money and share columns to text so precision survives JSON', async () => {
    const mock = useMock({ data: [ROW] });

    await fetchTransactions();

    expect(lastCall(mock.calls).select).toContain('invested_amount::text');
    expect(lastCall(mock.calls).select).toContain('shares::text');
  });

  it('returns the newest purchase first', async () => {
    const mock = useMock({ data: [ROW] });

    await fetchTransactions();

    expect(lastCall(mock.calls).order[0]).toEqual({
      column: 'purchase_date',
      options: { ascending: false },
    });
  });

  it('applies the stock and date filters when given', async () => {
    const mock = useMock({ data: [] });

    await fetchTransactions({ stockId: 'stock-cpall', from: '2026-08-01', to: '2026-08-31' });

    expect(lastCall(mock.calls).filters).toEqual([
      { method: 'eq', args: ['stock_id', 'stock-cpall'] },
      { method: 'gte', args: ['purchase_date', '2026-08-01'] },
      { method: 'lte', args: ['purchase_date', '2026-08-31'] },
    ]);
  });

  it('applies no filters when none are given', async () => {
    const mock = useMock({ data: [] });

    await fetchTransactions();

    expect(lastCall(mock.calls).filters).toEqual([]);
  });

  it('surfaces a query error instead of returning empty data', async () => {
    useMock({ data: null, error: new Error('permission denied for table transactions') });

    await expect(fetchTransactions()).rejects.toThrow(/permission denied/);
  });
});

describe('fetchStocks', () => {
  it('lists only active stocks, ordered by symbol', async () => {
    const mock = useMock({ data: [] });

    await fetchStocks();

    const call = lastCall(mock.calls);
    expect(call.table).toBe('stocks');
    expect(call.filters).toEqual([{ method: 'eq', args: ['is_active', true] }]);
    expect(call.order[0]?.column).toBe('symbol');
  });
});

describe('mutations', () => {
  const input = {
    purchaseDate: '2026-08-09',
    stockId: 'stock-cpall',
    investedAmount: '12500',
    shares: '200',
  };

  it('never sends a client-chosen user_id on insert', async () => {
    const mock = useMock({ data: null });

    await createTransaction(input);

    const call = lastCall(mock.calls);
    expect(call.operation).toBe('insert');
    expect(call.payload).toEqual({
      stock_id: 'stock-cpall',
      purchase_date: '2026-08-09',
      invested_amount: '12500',
      shares: '200',
    });
    expect(call.payload).not.toHaveProperty('user_id');
  });

  it('updates only the addressed transaction', async () => {
    const mock = useMock({ data: null });

    await updateTransaction('tx-1', { ...input, investedAmount: '13000' });

    const call = lastCall(mock.calls);
    expect(call.operation).toBe('update');
    expect(call.filters).toEqual([{ method: 'eq', args: ['id', 'tx-1'] }]);
    expect(call.payload).toMatchObject({ invested_amount: '13000' });
  });

  it('deletes only the addressed transaction', async () => {
    const mock = useMock({ data: null });

    await deleteTransaction('tx-1');

    const call = lastCall(mock.calls);
    expect(call.operation).toBe('delete');
    expect(call.filters).toEqual([{ method: 'eq', args: ['id', 'tx-1'] }]);
  });

  it('propagates a write failure', async () => {
    useMock({ error: new Error('new row violates row-level security policy') });

    await expect(createTransaction(input)).rejects.toThrow(/row-level security/);
  });
});
