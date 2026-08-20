import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuthValue, renderWithAuth } from '@/test/auth-harness';

type Filter = { method: string; args: unknown[] };

const state = vi.hoisted(() => ({
  transactions: [] as unknown[],
  error: null as unknown,
  lastFilters: [] as { method: string; args: unknown[] }[],
  operations: [] as string[],
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      const filters: Filter[] = [];

      const builder: Record<string, unknown> = {
        then: (resolve: (value: unknown) => unknown) => {
          if (table === 'transactions') state.lastFilters = filters;
          return Promise.resolve(
            resolve({
              data: table === 'transactions' ? state.transactions : [],
              error: table === 'transactions' ? state.error : null,
            }),
          );
        },
      };

      for (const method of ['eq', 'gte', 'lte']) {
        builder[method] = (...args: unknown[]) => {
          filters.push({ method, args });
          return builder;
        };
      }
      for (const method of ['select', 'order']) {
        builder[method] = () => builder;
      }
      builder.delete = () => {
        state.operations.push('delete');
        return builder;
      };
      builder.update = () => {
        state.operations.push('update');
        return builder;
      };
      return builder;
    },
  },
}));

const { HistoryPage } = await import('@/pages/HistoryPage');

function stockRow(id: string, symbol: string, nameTh: string) {
  return { id, symbol, name_th: nameTh, market: 'SET', is_active: true };
}

const CPALL = stockRow('stock-cpall', 'CPALL', 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)');
const PTT = stockRow('stock-ptt', 'PTT', 'บริษัท ปตท. จำกัด (มหาชน)');

function transactionRow(
  id: string,
  stock: typeof CPALL,
  invested: string,
  shares: string,
  date: string,
) {
  return {
    id,
    user_id: 'user-1',
    stock_id: stock.id,
    purchase_date: date,
    invested_amount: invested,
    shares,
    created_at: `${date}T10:00:00.000Z`,
    updated_at: `${date}T10:00:00.000Z`,
    stocks: stock,
  };
}

function render() {
  return renderWithAuth(<HistoryPage />, {
    auth: createAuthValue({ status: 'authenticated' }),
  });
}

beforeEach(() => {
  state.error = null;
  state.lastFilters = [];
  state.operations = [];
  state.transactions = [
    transactionRow('t1', CPALL, '12500.00', '200', '2026-08-09'),
    transactionRow('t2', PTT, '20000.00', '600', '2026-07-15'),
  ];
});

describe('HistoryPage', () => {
  it('shows a loading state first', () => {
    render();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('lists every purchase with a derived price per share', async () => {
    render();

    const table = await screen.findByRole('table');
    expect(within(table).getByText('09/08/2026')).toBeInTheDocument();
    expect(within(table).getByText('CPALL')).toBeInTheDocument();
    expect(within(table).getByText('฿62.50')).toBeInTheDocument();
    expect(within(table).getByText('฿33.33')).toBeInTheDocument();
  });

  it('renders the exact columns the design specifies', async () => {
    render();

    const table = await screen.findByRole('table');
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

    expect(headers).toEqual([
      'Date',
      'Stock',
      'Invested Amount',
      'Shares',
      'Price/Share',
      'Actions',
    ]);
  });

  it('offers a mobile card for every transaction as well as the table', async () => {
    render();

    await screen.findByRole('table');
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('searches by symbol without a round trip', async () => {
    render();
    await screen.findByRole('table');

    await userEvent.type(screen.getByLabelText('Search'), 'cpall');

    await waitFor(() => {
      expect(within(screen.getByRole('table')).queryByText('PTT')).not.toBeInTheDocument();
    });
    expect(within(screen.getByRole('table')).getByText('CPALL')).toBeInTheDocument();
  });

  it('searches by Thai name', async () => {
    render();
    await screen.findByRole('table');

    await userEvent.type(screen.getByLabelText('Search'), 'ปตท');

    await waitFor(() => {
      expect(within(screen.getByRole('table')).queryByText('CPALL')).not.toBeInTheDocument();
    });
    expect(within(screen.getByRole('table')).getByText('PTT')).toBeInTheDocument();
  });

  it('narrows the query itself for the stock and date filters', async () => {
    render();
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('Stock'), 'stock-cpall');

    await waitFor(() => {
      expect(state.lastFilters).toContainEqual({
        method: 'eq',
        args: ['stock_id', 'stock-cpall'],
      });
    });

    await userEvent.type(screen.getByLabelText('From'), '2026-08-01');
    await waitFor(() => {
      expect(state.lastFilters).toContainEqual({
        method: 'gte',
        args: ['purchase_date', '2026-08-01'],
      });
    });
  });

  it('distinguishes no data from no match, and clears filters', async () => {
    render();
    await screen.findByRole('table');

    await userEvent.type(screen.getByLabelText('Search'), 'zzzz');

    expect(await screen.findByText('No transactions match these filters.')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!);

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('invites a first purchase when nothing has ever been recorded', async () => {
    state.transactions = [];
    render();

    expect(await screen.findByText('No transactions yet.')).toBeInTheDocument();
  });

  it('reports a load failure with a retry', async () => {
    state.error = new Error('permission denied for table transactions');
    render();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load your transactions.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('opens the edit dialog pre-filled from the row', async () => {
    render();
    const table = await screen.findByRole('table');

    await userEvent.click(within(table).getByRole('button', { name: /Edit CPALL/ }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Edit Purchase');
    expect(within(dialog).getByLabelText('Invested Amount')).toHaveValue('12500.00');
  });

  it('confirms before deleting', async () => {
    render();
    const table = await screen.findByRole('table');

    await userEvent.click(within(table).getByRole('button', { name: /Delete CPALL/ }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Delete Transaction?');
    expect(
      within(dialog).getByText('This will recalculate the portfolio.'),
    ).toBeInTheDocument();
    expect(state.operations).not.toContain('delete');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(state.operations).toContain('delete'));
  });
});
