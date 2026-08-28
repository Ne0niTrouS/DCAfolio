import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '@/test/query-harness';
import { phrase } from '@/test/i18n-harness';

const state = vi.hoisted(() => ({ stocks: [] as unknown[], error: null as unknown }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      const builder: Record<string, unknown> = {
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve(resolve({ data: state.stocks, error: state.error })),
      };
      for (const method of ['select', 'eq', 'order']) builder[method] = () => builder;
      return builder;
    },
  },
}));

const { StockMasterPage } = await import('@/pages/StockMasterPage');

function stockRows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `stock-${index}`,
    symbol: `SYM${String(index).padStart(2, '0')}`,
    name_th: `บริษัท ${index} จำกัด (มหาชน)`,
    market: 'SET',
    is_active: true,
  }));
}

function rows() {
  return within(screen.getByRole('list')).getAllByRole('listitem');
}

function pageButton(key: 'common.previous' | 'common.next') {
  return screen.getByRole('button', { name: phrase(key) });
}

beforeEach(() => {
  state.stocks = stockRows(35);
  state.error = null;
});

describe('StockMasterPage', () => {
  it('no longer offers a way to add a stock', async () => {
    // The register is read-only; a symbol is added by migration, which keeps
    // the repository the definition of what production holds.
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    expect(screen.queryByLabelText(/Symbol|ชื่อย่อ/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add stock|เพิ่มหุ้น/ })).not.toBeInTheDocument();
  });

  it('shows one page at a time and says which part of the list it is', async () => {
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    expect(rows()).toHaveLength(20);
    expect(
      screen.getByText(phrase('master.showing', { from: 1, to: 20, total: 35 })),
    ).toBeInTheDocument();
  });

  it('moves to the next page', async () => {
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    await userEvent.click(pageButton('common.next'));

    expect(screen.getByText('SYM20')).toBeInTheDocument();
    expect(screen.queryByText('SYM00')).not.toBeInTheDocument();
    expect(
      screen.getByText(phrase('master.showing', { from: 21, to: 35, total: 35 })),
    ).toBeInTheDocument();
  });

  it('cannot step past either end', async () => {
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    expect(pageButton('common.previous')).toBeDisabled();

    await userEvent.click(pageButton('common.next'));
    expect(pageButton('common.next')).toBeDisabled();
    expect(pageButton('common.previous')).toBeEnabled();
  });

  it('returns to the first page when the search changes', async () => {
    // Searching from page 2 would otherwise land on an empty page and read as
    // "no results" for a search that has plenty.
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    await userEvent.click(pageButton('common.next'));
    await userEvent.type(screen.getByLabelText(phrase('master.search')), 'SYM0');

    expect(screen.getByText('SYM00')).toBeInTheDocument();
    expect(rows()).toHaveLength(10);
  });

  it('pages the search results, not the whole list', async () => {
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    await userEvent.type(screen.getByLabelText(phrase('master.search')), 'SYM1');

    expect(
      screen.getByText(phrase('master.showing', { from: 1, to: 10, total: 10 })),
    ).toBeInTheDocument();
  });

  it('says plainly when a search matches nothing', async () => {
    renderWithQuery(<StockMasterPage />);
    await screen.findByText('SYM00');

    await userEvent.type(screen.getByLabelText(phrase('master.search')), 'nothing');

    expect(screen.getByText(phrase('master.empty'))).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('reports a failure to load', async () => {
    state.error = new Error('network down');
    renderWithQuery(<StockMasterPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('master.loadError'));
  });
});
