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
      'validation.futureDate',
    );
  });

  it('rejects a missing or malformed date', () => {
    expect(validateTransaction(draft({ purchaseDate: '' }), TODAY).purchaseDate).toBe(
      'validation.selectPurchaseDate',
    );
    expect(validateTransaction(draft({ purchaseDate: '09/08/2026' }), TODAY).purchaseDate).toBe(
      'validation.invalidDate',
    );
  });

  it('requires a stock', () => {
    expect(validateTransaction(draft({ stockId: '' }), TODAY).stockId).toBe(
      'validation.selectStock',
    );
  });

  it('requires a positive invested amount', () => {
    expect(validateTransaction(draft({ investedAmount: '' }), TODAY).investedAmount).toBe(
      'validation.investedAmountRequired',
    );
    expect(validateTransaction(draft({ investedAmount: '0' }), TODAY).investedAmount).toBe(
      'validation.investedAmountPositive',
    );
    expect(validateTransaction(draft({ investedAmount: '-100' }), TODAY).investedAmount).toBe(
      'validation.investedAmountPositive',
    );
    expect(validateTransaction(draft({ investedAmount: 'abc' }), TODAY).investedAmount).toBe(
      'validation.investedAmountPositive',
    );
  });

  it('rejects an amount with more precision than satang', () => {
    expect(
      validateTransaction(draft({ investedAmount: '12500.123' }), TODAY).investedAmount,
    ).toBe('validation.moneyDecimals');
    expect(
      validateTransaction(draft({ investedAmount: '12500.12' }), TODAY).investedAmount,
    ).toBeUndefined();
  });

  it('requires a positive share count', () => {
    expect(validateTransaction(draft({ shares: '' }), TODAY).shares).toBe(
      'validation.sharesRequired',
    );
    expect(validateTransaction(draft({ shares: '0' }), TODAY).shares).toBe(
      'validation.sharesPositive',
    );
    expect(validateTransaction(draft({ shares: '-5' }), TODAY).shares).toBe(
      'validation.sharesPositive',
    );
  });

  it('rejects a share count with more than four decimals', () => {
    expect(validateTransaction(draft({ shares: '200.12345' }), TODAY).shares).toBe(
      'validation.shareDecimals',
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
