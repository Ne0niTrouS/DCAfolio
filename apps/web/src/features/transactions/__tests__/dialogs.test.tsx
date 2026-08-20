import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '@/test/query-harness';
import { createSupabaseMock, type RecordedCall } from '@/test/supabase-mock';

const state = vi.hoisted(() => ({
  mock: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock('@/lib/supabase', () => ({
  get supabase() {
    return state.mock!.supabase;
  },
}));

const { TransactionDialog } = await import('../TransactionDialog');
const { DeleteTransactionDialog } = await import('../DeleteTransactionDialog');

const TODAY = '2026-08-20';

const STOCKS: Stock[] = [
  {
    id: 'stock-cpall',
    symbol: 'CPALL',
    nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    market: 'SET',
    isActive: true,
  },
];

const TRANSACTION: TransactionWithStock = {
  id: 'tx-1',
  userId: 'user-1',
  stockId: 'stock-cpall',
  purchaseDate: '2026-08-09',
  investedAmount: '12500.00',
  shares: '200',
  createdAt: '2026-08-09T10:00:00.000Z',
  updatedAt: '2026-08-09T10:00:00.000Z',
  stock: STOCKS[0]!,
};

function lastCall(calls: RecordedCall[]): RecordedCall | undefined {
  return calls[calls.length - 1];
}

beforeEach(() => {
  state.mock = createSupabaseMock({ data: null });
});

describe('TransactionDialog', () => {
  it('adds a purchase and closes', async () => {
    const onClose = vi.fn();
    renderWithQuery(<TransactionDialog stocks={STOCKS} today={TODAY} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Add Purchase');

    await userEvent.selectOptions(screen.getByLabelText('Stock'), 'stock-cpall');
    await userEvent.type(screen.getByLabelText('Invested Amount'), '12500');
    await userEvent.type(screen.getByLabelText('Shares Received'), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Add Purchase' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(lastCall(state.mock!.calls)?.operation).toBe('insert');
  });

  it('edits an existing purchase', async () => {
    const onClose = vi.fn();
    renderWithQuery(
      <TransactionDialog
        stocks={STOCKS}
        transaction={TRANSACTION}
        today={TODAY}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Edit Purchase');

    const amount = screen.getByLabelText('Invested Amount');
    await userEvent.clear(amount);
    await userEvent.type(amount, '13000');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const call = lastCall(state.mock!.calls);
    expect(call?.operation).toBe('update');
    expect(call?.payload).toMatchObject({ invested_amount: '13000' });
    expect(call?.filters).toEqual([{ method: 'eq', args: ['id', 'tx-1'] }]);
  });

  it('reports a rejected write instead of closing', async () => {
    state.mock = createSupabaseMock({
      error: new Error(
        'new row for relation "transactions" violates check constraint ' +
          '"transactions_invested_amount_positive"',
      ),
    });
    const onClose = vi.fn();
    renderWithQuery(<TransactionDialog stocks={STOCKS} today={TODAY} onClose={onClose} />);

    await userEvent.selectOptions(screen.getByLabelText('Stock'), 'stock-cpall');
    await userEvent.type(screen.getByLabelText('Invested Amount'), '12500');
    await userEvent.type(screen.getByLabelText('Shares Received'), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Add Purchase' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invested amount must be greater than 0.',
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    renderWithQuery(<TransactionDialog stocks={STOCKS} today={TODAY} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});

describe('DeleteTransactionDialog', () => {
  it('shows exactly what will be deleted and warns about recalculation', () => {
    renderWithQuery(<DeleteTransactionDialog transaction={TRANSACTION} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Delete Transaction?');
    expect(screen.getByText('CPALL')).toBeInTheDocument();
    expect(screen.getByText('09/08/2026')).toBeInTheDocument();
    expect(screen.getByText('฿12,500.00')).toBeInTheDocument();
    expect(screen.getByText('200 shares')).toBeInTheDocument();
    expect(screen.getByText('฿62.50')).toBeInTheDocument();
    expect(screen.getByText('This will recalculate the portfolio.')).toBeInTheDocument();
  });

  it('does nothing when cancelled', async () => {
    const onClose = vi.fn();
    renderWithQuery(<DeleteTransactionDialog transaction={TRANSACTION} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(state.mock!.calls).toHaveLength(0);
  });

  it('deletes only the confirmed transaction', async () => {
    const onClose = vi.fn();
    renderWithQuery(<DeleteTransactionDialog transaction={TRANSACTION} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const call = lastCall(state.mock!.calls);
    expect(call?.operation).toBe('delete');
    expect(call?.filters).toEqual([{ method: 'eq', args: ['id', 'tx-1'] }]);
  });

  it('keeps the dialog open when the delete is refused', async () => {
    state.mock = createSupabaseMock({
      error: new Error('permission denied for table transactions'),
    });
    const onClose = vi.fn();
    renderWithQuery(<DeleteTransactionDialog transaction={TRANSACTION} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have access to that record.',
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
