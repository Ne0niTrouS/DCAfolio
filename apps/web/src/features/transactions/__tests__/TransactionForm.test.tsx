import type { Stock } from '@dcafolio/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TransactionForm } from '../TransactionForm';

const TODAY = '2026-08-20';

const STOCKS: Stock[] = [
  {
    id: 'stock-cpall',
    symbol: 'CPALL',
    nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    market: 'SET',
    isActive: true,
  },
  {
    id: 'stock-ptt',
    symbol: 'PTT',
    nameTh: 'บริษัท ปตท. จำกัด (มหาชน)',
    market: 'SET',
    isActive: true,
  },
];

function setup(props: Partial<Parameters<typeof TransactionForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <TransactionForm
      stocks={STOCKS}
      today={TODAY}
      submitLabel="Add Purchase"
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel };
}

describe('TransactionForm', () => {
  it('asks only for what actually happened', () => {
    setup();

    expect(screen.getByLabelText('Purchase Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock')).toBeInTheDocument();
    expect(screen.getByLabelText('Invested Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Shares Received')).toBeInTheDocument();
    // The user is never asked to type the purchase price.
    expect(screen.queryByLabelText(/price/i)).not.toBeInTheDocument();
  });

  it('derives the price per share while the user types', async () => {
    setup();

    expect(screen.getByText('—')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Invested Amount'), '12500');
    await userEvent.type(screen.getByLabelText('Shares Received'), '200');

    expect(screen.getByText('฿62.50/share')).toBeInTheDocument();
  });

  it('shows no derived price until both fields are usable', async () => {
    setup();

    await userEvent.type(screen.getByLabelText('Invested Amount'), '12500');
    await userEvent.type(screen.getByLabelText('Shares Received'), '0');

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('defaults the purchase date to today and refuses a future one', async () => {
    const { onSubmit } = setup();

    const date = screen.getByLabelText('Purchase Date');
    expect(date).toHaveValue(TODAY);
    expect(date).toHaveAttribute('max', TODAY);

    await userEvent.clear(date);
    await userEvent.type(date, '2026-08-21');
    await userEvent.selectOptions(screen.getByLabelText('Stock'), 'stock-cpall');
    await userEvent.type(screen.getByLabelText('Invested Amount'), '12500');
    await userEvent.type(screen.getByLabelText('Shares Received'), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Add Purchase' }));

    expect(screen.getByText('Purchase date cannot be in the future.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submission until every field is valid', async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add Purchase' }));

    expect(screen.getByText('Select a stock.')).toBeInTheDocument();
    expect(screen.getByText('Enter the amount invested.')).toBeInTheDocument();
    expect(screen.getByText('Enter the number of shares received.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a complete purchase', async () => {
    const { onSubmit } = setup();

    await userEvent.selectOptions(screen.getByLabelText('Stock'), 'stock-cpall');
    await userEvent.type(screen.getByLabelText('Invested Amount'), '12500');
    await userEvent.type(screen.getByLabelText('Shares Received'), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Add Purchase' }));

    expect(onSubmit).toHaveBeenCalledWith({
      purchaseDate: TODAY,
      stockId: 'stock-cpall',
      investedAmount: '12500',
      shares: '200',
    });
  });

  it('pre-fills every field when editing', () => {
    setup({
      submitLabel: 'Save',
      initialValues: {
        purchaseDate: '2026-06-09',
        stockId: 'stock-ptt',
        investedAmount: '20000',
        shares: '600',
      },
    });

    expect(screen.getByLabelText('Purchase Date')).toHaveValue('2026-06-09');
    expect(screen.getByLabelText('Stock')).toHaveValue('stock-ptt');
    expect(screen.getByLabelText('Invested Amount')).toHaveValue('20000');
    expect(screen.getByLabelText('Shares Received')).toHaveValue('600');
    expect(screen.getByText('฿33.33/share')).toBeInTheDocument();
  });

  it('cancels without submitting', async () => {
    const { onSubmit, onCancel } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a submission error above the form', () => {
    setup({ error: 'Something went wrong. Please try again.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });
});
