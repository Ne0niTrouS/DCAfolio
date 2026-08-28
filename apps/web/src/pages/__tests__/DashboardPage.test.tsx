import { screen, within } from '@testing-library/react';
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

  it('says the portfolio is empty without offering to fill it', async () => {
    // The dashboard reports the portfolio; recording a purchase belongs to
    // History, and this screen no longer suggests otherwise.
    render();

    expect(await screen.findByText(phrase('dashboard.emptyTitle'))).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.emptyBody'))).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: phrase('common.addPurchase') }),
    ).not.toBeInTheDocument();
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

  it('puts cost and current value in one card, each stated once', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    const card = await screen.findByRole('region', { name: phrase('dashboard.costVsValue') });

    expect(within(card).getByText(phrase('dashboard.portfolioValue'))).toBeInTheDocument();
    expect(within(card).getByText(phrase('dashboard.totalInvested'))).toBeInTheDocument();
    expect(within(card).getAllByText('฿13,000.00')).toHaveLength(1);
    expect(within(card).getAllByText('฿12,500.00')).toHaveLength(1);
  });

  it('no longer reports a monthly DCA average beside current-state figures', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    await screen.findByText(phrase('dashboard.portfolioValue'));
    expect(screen.queryByText(phrase('dashboard.dcaPerMonth'))).not.toBeInTheDocument();
  });

  it('will not chart a trend from a single purchase date', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    expect(await screen.findByText(phrase('dashboard.notEnoughHistory'))).toBeInTheDocument();
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
      screen.getByText(phrase('market.source', { source: 'Mock provider' })),
    ).toBeInTheDocument();
  });

  it('keeps the dashboard usable when the price query fails', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.pricesError = new Error('network down');
    render();

    // Nothing loaded because the request failed is not the same as nothing
    // stored, and the panel must not report the second when it means the first.
    expect(await screen.findByText(phrase('dashboard.totalInvested'))).toBeInTheDocument();
    expect(screen.getByText(phrase('market.pricesUnavailable'))).toBeInTheDocument();
    expect(screen.queryByText(phrase('market.noPricesYet'))).not.toBeInTheDocument();
  });

  it('lists positions and recent transactions', async () => {
    state.transactions = [TRANSACTION_ROW];
    state.prices = [priceRow()];
    render();

    // Two routes to the same holding now: the ring slice and the list row.
    const links = await screen.findAllByRole('link', { name: /CPALL/ });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/stocks/CPALL');
    expect(screen.getByText(phrase('dashboard.recentTransactions'))).toBeInTheDocument();
    expect(screen.getAllByText('09/08/2026').length).toBeGreaterThan(0);
  });
});
