import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import { createAuthValue, renderWithAuth } from '@/test/auth-harness';

const state = vi.hoisted(() => ({
  transactions: [] as unknown[],
  prices: [] as unknown[],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const builder: Record<string, unknown> = {
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve(
            resolve({
              data:
                table === 'transactions'
                  ? state.transactions
                  : table === 'latest_market_prices'
                    ? state.prices
                    : [],
              error: null,
            }),
          ),
      };
      for (const method of ['select', 'eq', 'gte', 'lte', 'order']) {
        builder[method] = () => builder;
      }
      return builder;
    },
  },
}));

const { StockDetailPage } = await import('@/pages/StockDetailPage');

const STOCK_ROW = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  name_th: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  is_active: true,
};

function transactionRow(id: string, invested: string, shares: string, date: string) {
  return {
    id,
    user_id: 'user-1',
    stock_id: 'stock-cpall',
    purchase_date: date,
    invested_amount: invested,
    shares,
    created_at: `${date}T10:00:00.000Z`,
    updated_at: `${date}T10:00:00.000Z`,
    stocks: STOCK_ROW,
  };
}

function render(symbol: string) {
  return renderWithAuth(
    <Routes>
      <Route path="/stocks/:symbol" element={<StockDetailPage />} />
    </Routes>,
    {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: [`/stocks/${symbol}`],
    },
  );
}

beforeEach(() => {
  state.transactions = [
    transactionRow('t1', '39250.00', '625', '2026-06-09'),
    transactionRow('t2', '39250.00', '625', '2026-07-09'),
  ];
  state.prices = [
    {
      stock_id: 'stock-cpall',
      symbol: 'CPALL',
      price: '65.25',
      provider: 'mock',
      captured_at: new Date().toISOString(),
      is_stale: false,
    },
  ];
});

describe('StockDetailPage', () => {
  it('shows the position exactly as the design specifies', async () => {
    render('CPALL');

    expect(await screen.findByRole('heading', { name: 'CPALL' })).toBeInTheDocument();
    expect(screen.getByText('บริษัท ซีพี ออลล์ จำกัด (มหาชน)')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getAllByText('฿78,500.00').length).toBeGreaterThan(0);
    expect(screen.getByText('฿62.80')).toBeInTheDocument();
    expect(screen.getByText('฿65.25')).toBeInTheDocument();
    expect(screen.getByText('฿81,562.50')).toBeInTheDocument();
    expect(screen.getByText('+฿3,062.50')).toBeInTheDocument();
    expect(screen.getByText('+3.90%')).toBeInTheDocument();
  });

  it('lists the purchase history with a derived price per share', async () => {
    render('CPALL');

    expect(await screen.findByText('Purchase history')).toBeInTheDocument();
    expect(screen.getByText('09/06/2026')).toBeInTheDocument();
    expect(screen.getByText('09/07/2026')).toBeInTheDocument();
    expect(screen.getAllByText('฿62.80/share')).toHaveLength(2);
  });

  it('names the provider and how old the price is', async () => {
    render('CPALL');

    expect(await screen.findByText(/Price from mock, updated just now/)).toBeInTheDocument();
  });

  it('says so plainly when no purchase of that stock exists', async () => {
    render('PTT');

    expect(await screen.findByText('No purchases recorded for PTT.')).toBeInTheDocument();
  });

  it('still shows cost figures when there is no price', async () => {
    state.prices = [];
    render('CPALL');

    expect(await screen.findByText('฿62.80')).toBeInTheDocument();
    expect(
      screen.getByText('No market price has been captured for this stock yet.'),
    ).toBeInTheDocument();
  });
});
