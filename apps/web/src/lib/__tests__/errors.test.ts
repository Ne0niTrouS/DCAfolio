import { describe, expect, it } from 'vitest';

import { mapDataError } from '@/lib/errors';

describe('mapDataError', () => {
  it('restates the schema rule the user broke, in the form’s own words', () => {
    expect(
      mapDataError(
        new Error('violates check constraint "transactions_invested_amount_positive"'),
      ),
    ).toBe('error.investedAmountPositive');

    expect(
      mapDataError(new Error('violates check constraint "transactions_shares_positive"')),
    ).toBe('error.sharesPositive');

    expect(
      mapDataError(
        new Error('violates check constraint "transactions_purchase_date_not_future"'),
      ),
    ).toBe('error.purchaseDateFuture');
  });

  it('explains a refused row rather than exposing the policy', () => {
    expect(mapDataError(new Error('new row violates row-level security policy'))).toBe(
      'error.forbidden',
    );
  });

  it('explains a missing stock reference', () => {
    expect(mapDataError(new Error('insert violates foreign key constraint'))).toBe(
      'error.stockUnavailable',
    );
  });

  it('explains an expired session', () => {
    expect(mapDataError(new Error('JWT expired'))).toBe('error.sessionExpired');
  });

  it('never leaks an unrecognised error', () => {
    expect(mapDataError(new Error('PGRST116 unexpected'))).toBe('error.generic');
    expect(mapDataError(undefined)).toBe('error.generic');
  });
});
