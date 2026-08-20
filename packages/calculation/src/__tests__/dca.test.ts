import { describe, expect, it } from 'vitest';

import { dcaPerMonth, distinctPurchaseMonths } from '../dca';

describe('distinctPurchaseMonths', () => {
  it('counts each calendar month once, however many purchases it holds', () => {
    expect(
      distinctPurchaseMonths([
        { purchaseDate: '2026-08-03' },
        { purchaseDate: '2026-08-19' },
        { purchaseDate: '2026-09-01' },
      ]),
    ).toBe(2);
  });

  it('does not invent the months between purchases', () => {
    expect(
      distinctPurchaseMonths([{ purchaseDate: '2026-01-15' }, { purchaseDate: '2026-12-15' }]),
    ).toBe(2);
  });

  it('is zero for no purchases', () => {
    expect(distinctPurchaseMonths([])).toBe(0);
  });

  it('rejects a malformed date rather than guessing', () => {
    expect(() => distinctPurchaseMonths([{ purchaseDate: '09/08/2026' }])).toThrow(
      /purchaseDate/,
    );
  });
});

describe('dcaPerMonth', () => {
  it('averages the amount invested across the months that had purchases', () => {
    expect(
      dcaPerMonth([
        { purchaseDate: '2026-06-09', investedAmount: '25000' },
        { purchaseDate: '2026-07-09', investedAmount: '25000' },
        { purchaseDate: '2026-08-09', investedAmount: '25000' },
      ]),
    ).toBe('25000.00');
  });

  it('treats several purchases in one month as one month of DCA', () => {
    expect(
      dcaPerMonth([
        { purchaseDate: '2026-08-03', investedAmount: '10000' },
        { purchaseDate: '2026-08-19', investedAmount: '15000' },
      ]),
    ).toBe('25000.00');
  });

  it('is null when nothing has been purchased', () => {
    expect(dcaPerMonth([])).toBeNull();
  });
});
