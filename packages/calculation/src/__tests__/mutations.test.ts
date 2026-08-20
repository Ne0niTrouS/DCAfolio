import { describe, expect, it } from 'vitest';

import { computePortfolio, type PositionInput, type PurchaseInput } from '../portfolio';

/**
 * Nothing is stored as an aggregate, so "editing" and "deleting" a transaction
 * is simply recomputing from a different input set. These tests pin that
 * promise: every derived figure must move with the transaction list.
 */

const PRICE = {
  price: '65.25',
  provider: 'mock',
  capturedAt: '2026-08-20T09:00:00.000Z',
  status: 'fresh',
} as const;

const ORIGINAL: PurchaseInput[] = [
  { purchaseDate: '2026-06-09', investedAmount: '39250.00', shares: '625' },
  { purchaseDate: '2026-07-09', investedAmount: '39250.00', shares: '625' },
];

function portfolioFor(transactions: PurchaseInput[]) {
  const input: PositionInput = {
    stockId: 'stock-cpall',
    symbol: 'CPALL',
    nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    transactions,
    price: PRICE,
  };
  return computePortfolio([input]);
}

describe('recomputation after an edit', () => {
  it('moves every derived figure when an amount is corrected', () => {
    const before = portfolioFor(ORIGINAL);
    expect(before.totalInvested).toBe('78500.00');
    expect(before.positions[0]!.averageCost).toBe('62.80');
    expect(before.profitLoss).toBe('3062.50');

    const edited = portfolioFor([
      ORIGINAL[0]!,
      { purchaseDate: '2026-07-09', investedAmount: '31250.00', shares: '625' },
    ]);

    expect(edited.totalInvested).toBe('70500.00');
    expect(edited.totalShares).toBe('1250');
    expect(edited.positions[0]!.averageCost).toBe('56.40');
    expect(edited.currentValue).toBe('81562.50');
    expect(edited.profitLoss).toBe('11062.50');
    expect(edited.returnPercent).toBe(15.69);
  });

  it('moves the share count and average cost when shares are corrected', () => {
    const edited = portfolioFor([
      ORIGINAL[0]!,
      { purchaseDate: '2026-07-09', investedAmount: '39250.00', shares: '500' },
    ]);

    expect(edited.totalShares).toBe('1125');
    expect(edited.positions[0]!.averageCost).toBe('69.78');
    expect(edited.currentValue).toBe('73406.25');
  });

  it('recomputes DCA per month when a purchase moves to another month', () => {
    expect(portfolioFor(ORIGINAL).dcaPerMonth).toBe('39250.00');

    const moved = portfolioFor([
      ORIGINAL[0]!,
      { purchaseDate: '2026-06-20', investedAmount: '39250.00', shares: '625' },
    ]);

    expect(moved.dcaPerMonth).toBe('78500.00');
  });
});

describe('recomputation after a delete', () => {
  it('drops the deleted purchase from every total', () => {
    const remaining = portfolioFor([ORIGINAL[0]!]);

    expect(remaining.transactionCount).toBe(1);
    expect(remaining.totalInvested).toBe('39250.00');
    expect(remaining.totalShares).toBe('625');
    expect(remaining.positions[0]!.averageCost).toBe('62.80');
    expect(remaining.currentValue).toBe('40781.25');
    expect(remaining.profitLoss).toBe('1531.25');
  });

  it('returns to an empty portfolio when the last purchase is deleted', () => {
    const empty = portfolioFor([]);

    expect(empty.transactionCount).toBe(0);
    expect(empty.totalInvested).toBe('0.00');
    expect(empty.totalShares).toBe('0');
    expect(empty.positions[0]!.averageCost).toBeNull();
    expect(empty.positions[0]!.returnPercent).toBeNull();
    expect(empty.dcaPerMonth).toBeNull();
    expect(empty.returnPercent).toBeNull();
  });
});
