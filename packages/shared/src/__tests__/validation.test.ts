import { describe, expect, it } from 'vitest';

import { hasErrors, validateTransaction, type TransactionDraft } from '../validation';

const TODAY = '2026-08-20';

function draft(overrides: Partial<TransactionDraft> = {}): TransactionDraft {
  return {
    purchaseDate: '2026-08-09',
    stockId: 'stock-cpall',
    investedAmount: '12500',
    shares: '200',
    ...overrides,
  };
}

describe('validateTransaction', () => {
  it('accepts a normal purchase', () => {
    expect(validateTransaction(draft(), TODAY)).toEqual({});
    expect(hasErrors(validateTransaction(draft(), TODAY))).toBe(false);
  });

  it('accepts a purchase made today', () => {
    expect(
      validateTransaction(draft({ purchaseDate: TODAY }), TODAY).purchaseDate,
    ).toBeUndefined();
  });

  it('rejects a purchase date in the future', () => {
    expect(validateTransaction(draft({ purchaseDate: '2026-08-21' }), TODAY).purchaseDate).toBe(
      'Purchase date cannot be in the future.',
    );
  });

  it('rejects a missing or malformed date', () => {
    expect(validateTransaction(draft({ purchaseDate: '' }), TODAY).purchaseDate).toBe(
      'Select a purchase date.',
    );
    expect(validateTransaction(draft({ purchaseDate: '09/08/2026' }), TODAY).purchaseDate).toBe(
      'Enter a valid date.',
    );
  });

  it('requires a stock', () => {
    expect(validateTransaction(draft({ stockId: '' }), TODAY).stockId).toBe('Select a stock.');
  });

  it('requires a positive invested amount', () => {
    expect(validateTransaction(draft({ investedAmount: '' }), TODAY).investedAmount).toBe(
      'Enter the amount invested.',
    );
    expect(validateTransaction(draft({ investedAmount: '0' }), TODAY).investedAmount).toBe(
      'Invested amount must be greater than 0.',
    );
    expect(validateTransaction(draft({ investedAmount: '-100' }), TODAY).investedAmount).toBe(
      'Invested amount must be greater than 0.',
    );
    expect(validateTransaction(draft({ investedAmount: 'abc' }), TODAY).investedAmount).toBe(
      'Invested amount must be greater than 0.',
    );
  });

  it('rejects an amount with more precision than satang', () => {
    expect(
      validateTransaction(draft({ investedAmount: '12500.123' }), TODAY).investedAmount,
    ).toBe('Use at most 2 decimal places.');
    expect(
      validateTransaction(draft({ investedAmount: '12500.12' }), TODAY).investedAmount,
    ).toBeUndefined();
  });

  it('requires a positive share count', () => {
    expect(validateTransaction(draft({ shares: '' }), TODAY).shares).toBe(
      'Enter the number of shares received.',
    );
    expect(validateTransaction(draft({ shares: '0' }), TODAY).shares).toBe(
      'Shares must be greater than 0.',
    );
    expect(validateTransaction(draft({ shares: '-5' }), TODAY).shares).toBe(
      'Shares must be greater than 0.',
    );
  });

  it('rejects a share count with more than four decimals', () => {
    expect(validateTransaction(draft({ shares: '200.12345' }), TODAY).shares).toBe(
      'Use at most 4 decimal places.',
    );
    expect(validateTransaction(draft({ shares: '200.1234' }), TODAY).shares).toBeUndefined();
  });

  it('reports every broken field at once', () => {
    const errors = validateTransaction(
      { purchaseDate: '', stockId: '', investedAmount: '0', shares: '-1' },
      TODAY,
    );

    expect(Object.keys(errors).sort()).toEqual([
      'investedAmount',
      'purchaseDate',
      'shares',
      'stockId',
    ]);
    expect(hasErrors(errors)).toBe(true);
  });
});
