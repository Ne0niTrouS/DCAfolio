import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { phrase } from '@/test/i18n-harness';

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

    expect(await screen.findByText(phrase('dashboard.emptyTitle'))).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.emptyBody'))).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: phrase('common.addPurchase') }).length,
    ).toBeGreaterThan(0);
  });

  it('reports a failure to load without blanking the page', async () => {
    state.transactionsError = new Error('permission denied for table transactions');
    render();

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('dashboard.loadError'));
    expect(screen.getByRole('button', { name: phrase('common.tryAgain') })).toBeInTheDocument();
  });

  it('answers invested, worth and up-or-down at a glance', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByText(phrase('dashboard.portfolioValue'))).toBeInTheDocument();
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
    expect(screen.getAllByText(`(${phrase('value.loss')})`, { exact: false })).not.toHaveLength(
      0,
    );
  });

  it('keeps working when there is no market price at all', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [];
    render();

    expect((await screen.findAllByText('฿12,500.00')).length).toBeGreaterThan(0);
    expect(screen.getByText(phrase('dashboard.partialPricing'))).toBeInTheDocument();
    expect(screen.getByText(phrase('market.noPriceYet'))).toBeInTheDocument();
  });

  it('labels a cached price instead of passing it off as live', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow({ captured_at: '2026-08-19T09:00:00.000Z' })];
    render();

    expect(await screen.findByText(phrase('market.cachedBadge'))).toBeInTheDocument();
  });

  it('labels mock data as mock', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByText(phrase('market.mockBadge'))).toBeInTheDocument();
    expect(
      screen.getByText(phrase('market.provider', { provider: 'mock' })),
    ).toBeInTheDocument();
  });

  it('keeps the dashboard usable when the price query fails', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.pricesError = new Error('network down');
    render();

    expect(await screen.findByText(phrase('dashboard.totalInvested'))).toBeInTheDocument();
    expect(screen.getByText(phrase('market.cachedBadge'))).toBeInTheDocument();
  });

  it('lists positions and recent transactions', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByRole('link', { name: /CPALL/ })).toHaveAttribute(
      'href',
      '/stocks/CPALL',
    );
    expect(screen.getByText(phrase('dashboard.recentTransactions'))).toBeInTheDocument();
    expect(screen.getAllByText('09/08/2026').length).toBeGreaterThan(0);
  });
});
