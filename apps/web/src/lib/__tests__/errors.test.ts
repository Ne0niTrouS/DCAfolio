import { describe, expect, it } from 'vitest';

import { mapDataError } from '@/lib/errors';

describe('mapDataError', () => {
  it('restates the schema rule the user broke, in the form’s own words', () => {
    expect(
      mapDataError(
        new Error('violates check constraint "transactions_invested_amount_positive"'),
      ),
    ).toBe('Invested amount must be greater than 0.');

    expect(
      mapDataError(new Error('violates check constraint "transactions_shares_positive"')),
    ).toBe('Shares must be greater than 0.');

    expect(
      mapDataError(
        new Error('violates check constraint "transactions_purchase_date_not_future"'),
      ),
    ).toBe('Purchase date cannot be in the future.');
  });

  it('explains a refused row rather than exposing the policy', () => {
    expect(mapDataError(new Error('new row violates row-level security policy'))).toBe(
      'You do not have access to that record.',
    );
  });

  it('explains a missing stock reference', () => {
    expect(mapDataError(new Error('insert violates foreign key constraint'))).toBe(
      'That stock is no longer available. Pick another one.',
    );
  });

  it('explains an expired session', () => {
    expect(mapDataError(new Error('JWT expired'))).toBe(
      'Your session has expired. Sign in again.',
    );
  });

  it('never leaks an unrecognised error', () => {
    expect(mapDataError(new Error('PGRST116 unexpected'))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(mapDataError(undefined)).toBe('Something went wrong. Please try again.');
  });
});
