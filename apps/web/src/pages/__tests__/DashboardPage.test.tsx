import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuthValue, renderWithAuth } from '@/test/auth-harness';

const state = vi.hoisted(() => ({
  transactions: [] as unknown[],
  prices: [] as unknown[],
  transactionsError: null as unknown,
  pricesError: null as unknown,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const respond = () => {
        if (table === 'transactions') {
          return { data: state.transactions, error: state.transactionsError };
        }
        if (table === 'latest_market_prices') {
          return { data: state.prices, error: state.pricesError };
        }
        return { data: [], error: null };
      };

      const builder: Record<string, unknown> = {
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(respond())),
      };
      for (const method of ['select', 'eq', 'gte', 'lte', 'order']) {
        builder[method] = () => builder;
      }
      return builder;
    },
  },
}));

const { DashboardPage } = await import('@/pages/DashboardPage');

const STOCK_ROW = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  name_th: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  is_active: true,
};

const TRANSACTION_ROW = {
  id: 'tx-1',
  user_id: 'user-1',
  stock_id: 'stock-cpall',
  purchase_date: '2026-08-09',
  invested_amount: '12500.00',
  shares: '200',
  created_at: '2026-08-09T10:00:00.000Z',
  updated_at: '2026-08-09T10:00:00.000Z',
  stocks: STOCK_ROW,
};

function priceRow(overrides: Record<string, unknown> = {}) {
  return {
    stock_id: 'stock-cpall',
    symbol: 'CPALL',
    price: '65.00',
    provider: 'mock',
    captured_at: new Date().toISOString(),
    is_stale: false,
    ...overrides,
  };
}

function render() {
  return renderWithAuth(<DashboardPage />, {
    auth: createAuthValue({ status: 'authenticated' }),
  });
}

beforeEach(() => {
  state.transactions = [];
  state.prices = [];
  state.transactionsError = null;
  state.pricesError = null;
});

describe('DashboardPage', () => {
  it('shows a loading state before any data arrives', () => {
    render();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('invites a first purchase when nothing has been recorded', async () => {
    render();

    expect(await screen.findByText('No investments yet.')).toBeInTheDocument();
    expect(screen.getByText('Add your first stock purchase.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add Purchase' }).length).toBeGreaterThan(0);
  });

  it('reports a failure to load without blanking the page', async () => {
    state.transactionsError = new Error('permission denied for table transactions');
    render();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your portfolio.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('answers invested, worth and up-or-down at a glance', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getAllByText('฿13,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('฿12,500.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+฿500.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+4.00%').length).toBeGreaterThan(0);
  });

  it('signs a loss explicitly rather than relying on colour', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow({ price: '55.00' })];
    render();

    expect((await screen.findAllByText('-฿1,500.00')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('-12.00%').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\(loss\)/).length).toBeGreaterThan(0);
  });

  it('keeps working when there is no market price at all', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [];
    render();

    expect((await screen.findAllByText('฿12,500.00')).length).toBeGreaterThan(0);
    expect(screen.getByText('Partial — some stocks have no price yet')).toBeInTheDocument();
    expect(screen.getByText('No market price yet')).toBeInTheDocument();
  });

  it('labels a cached price instead of passing it off as live', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow({ captured_at: '2026-08-19T09:00:00.000Z' })];
    render();

    expect(await screen.findByText('Cached — may be out of date')).toBeInTheDocument();
  });

  it('labels mock data as mock', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByText('Mock data — not real prices')).toBeInTheDocument();
    expect(screen.getByText('Provider: mock')).toBeInTheDocument();
  });

  it('keeps the dashboard usable when the price query fails', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.pricesError = new Error('network down');
    render();

    expect(await screen.findByText('Total Invested')).toBeInTheDocument();
    expect(screen.getByText('Cached — may be out of date')).toBeInTheDocument();
  });

  it('lists positions and recent transactions', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByRole('link', { name: /CPALL/ })).toHaveAttribute(
      'href',
      '/stocks/CPALL',
    );
    expect(screen.getByText('Recent transactions')).toBeInTheDocument();
    expect(screen.getByText('09/08/2026')).toBeInTheDocument();
  });
});
