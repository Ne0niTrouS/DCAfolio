import type { TransactionWithStock } from '@dcafolio/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { RecentTransactions } from '../RecentTransactions';

function transaction(index: number): TransactionWithStock {
  return {
    id: `tx-${index}`,
    userId: 'user-1',
    stockId: 'stock-cpall',
    purchaseDate: `2026-08-${String(index + 1).padStart(2, '0')}`,
    investedAmount: '1000.00',
    shares: '100',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    stock: {
      id: 'stock-cpall',
      symbol: 'CPALL',
      nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
      market: 'SET',
      isActive: true,
    },
  };
}

function list(count: number) {
  render(
    <MemoryRouter>
      <RecentTransactions transactions={Array.from({ length: count }, (_, i) => transaction(i))} />
    </MemoryRouter>,
  );
  return within(screen.getByRole('table'));
}

describe('RecentTransactions', () => {
  it('shows the ten most recent', () => {
    expect(list(25).getAllByRole('row')).toHaveLength(11); // ten plus the header
  });

  it('shows everything when there are fewer than ten', () => {
    expect(list(3).getAllByRole('row')).toHaveLength(4);
  });

  it('keeps the order it was given, newest first', () => {
    const table = list(12);
    const [, firstRow] = table.getAllByRole('row');

    expect(within(firstRow!).getByText('01/08/2026')).toBeInTheDocument();
  });

  it('links out to the full history rather than growing without limit', () => {
    render(
      <MemoryRouter>
        <RecentTransactions transactions={[transaction(0)]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: phrase('dashboard.viewAll') })).toHaveAttribute(
      'href',
      '/history',
    );
  });
});
