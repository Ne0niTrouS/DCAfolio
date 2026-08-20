import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { TransactionCard } from '../TransactionCard';

const CPALL: Stock = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  isActive: true,
};

const TRANSACTION: TransactionWithStock = {
  id: 't1',
  userId: 'user-1',
  stockId: 'stock-cpall',
  purchaseDate: '2026-08-09',
  investedAmount: '12500.00',
  shares: '200',
  createdAt: '2026-08-09T10:00:00.000Z',
  updatedAt: '2026-08-09T10:00:00.000Z',
  stock: CPALL,
};

function setup() {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(<TransactionCard transaction={TRANSACTION} onEdit={onEdit} onDelete={onDelete} />);
  return { onEdit, onDelete };
}

describe('TransactionCard', () => {
  it('shows the same five facts as the desktop table', () => {
    setup();

    expect(screen.getByText('CPALL')).toBeInTheDocument();
    expect(screen.getByText('09/08/2026')).toBeInTheDocument();
    expect(screen.getByText('฿12,500.00')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('฿62.50')).toBeInTheDocument();
  });

  it('names its actions so they mean something out of context', async () => {
    const { onEdit, onDelete } = setup();

    await userEvent.click(
      screen.getByRole('button', {
        name: phrase('history.editRow', { symbol: 'CPALL', date: '09/08/2026' }),
      }),
    );
    expect(onEdit).toHaveBeenCalledWith(TRANSACTION);

    await userEvent.click(
      screen.getByRole('button', {
        name: phrase('history.deleteRow', { symbol: 'CPALL', date: '09/08/2026' }),
      }),
    );
    expect(onDelete).toHaveBeenCalledWith(TRANSACTION);
  });
});
