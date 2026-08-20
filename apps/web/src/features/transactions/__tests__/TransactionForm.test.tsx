import type { Stock } from '@dcafolio/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { phrase } from '@/test/i18n-harness';

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
      submitLabel={phrase('common.addPurchase')}
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

    expect(screen.getByLabelText(phrase('purchase.purchaseDate'))).toBeInTheDocument();
    expect(screen.getByLabelText(phrase('purchase.stock'))).toBeInTheDocument();
    expect(screen.getByLabelText(phrase('purchase.investedAmount'))).toBeInTheDocument();
    expect(screen.getByLabelText(phrase('purchase.sharesReceived'))).toBeInTheDocument();
    // The user is never asked to type the purchase price.
    expect(screen.queryByLabelText(/price/i)).not.toBeInTheDocument();
  });

  it('derives the price per share while the user types', async () => {
    setup();

    expect(screen.getByText('—')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(phrase('purchase.investedAmount')), '12500');
    await userEvent.type(screen.getByLabelText(phrase('purchase.sharesReceived')), '200');

    expect(
      screen.getByText(phrase('purchase.perShare', { value: '฿62.50' })),
    ).toBeInTheDocument();
  });

  it('shows no derived price until both fields are usable', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(phrase('purchase.investedAmount')), '12500');
    await userEvent.type(screen.getByLabelText(phrase('purchase.sharesReceived')), '0');

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('defaults the purchase date to today and refuses a future one', async () => {
    const { onSubmit } = setup();

    const date = screen.getByLabelText(phrase('purchase.purchaseDate'));
    expect(date).toHaveValue(TODAY);
    expect(date).toHaveAttribute('max', TODAY);

    await userEvent.clear(date);
    await userEvent.type(date, '2026-08-21');
    await userEvent.selectOptions(
      screen.getByLabelText(phrase('purchase.stock')),
      'stock-cpall',
    );
    await userEvent.type(screen.getByLabelText(phrase('purchase.investedAmount')), '12500');
    await userEvent.type(screen.getByLabelText(phrase('purchase.sharesReceived')), '200');
    await userEvent.click(screen.getByRole('button', { name: phrase('common.addPurchase') }));

    expect(screen.getByText(phrase('validation.futureDate'))).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('blocks submission until every field is valid', async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole('button', { name: phrase('common.addPurchase') }));

    expect(screen.getByText(phrase('validation.selectStock'))).toBeInTheDocument();
    expect(screen.getByText(phrase('validation.investedAmountRequired'))).toBeInTheDocument();
    expect(screen.getByText(phrase('validation.sharesRequired'))).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a complete purchase', async () => {
    const { onSubmit } = setup();

    await userEvent.selectOptions(
      screen.getByLabelText(phrase('purchase.stock')),
      'stock-cpall',
    );
    await userEvent.type(screen.getByLabelText(phrase('purchase.investedAmount')), '12500');
    await userEvent.type(screen.getByLabelText(phrase('purchase.sharesReceived')), '200');
    await userEvent.click(screen.getByRole('button', { name: phrase('common.addPurchase') }));

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

    expect(screen.getByLabelText(phrase('purchase.purchaseDate'))).toHaveValue('2026-06-09');
    expect(screen.getByLabelText(phrase('purchase.stock'))).toHaveValue('stock-ptt');
    expect(screen.getByLabelText(phrase('purchase.investedAmount'))).toHaveValue('20000');
    expect(screen.getByLabelText(phrase('purchase.sharesReceived'))).toHaveValue('600');
    expect(
      screen.getByText(phrase('purchase.perShare', { value: '฿33.33' })),
    ).toBeInTheDocument();
  });

  it('cancels without submitting', async () => {
    const { onSubmit, onCancel } = setup();

    await userEvent.click(screen.getByRole('button', { name: phrase('common.cancel') }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a submission error above the form', () => {
    setup({ error: 'error.generic' });

    expect(screen.getByRole('alert')).toHaveTextContent(phrase('error.generic'));
  });
});
