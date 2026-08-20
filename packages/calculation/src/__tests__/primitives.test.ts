import { describe, expect, it } from 'vitest';

import { InvalidFinancialValueError } from '../decimal';
import {
  allocationPercent,
  averageCost,
  currentValue,
  netAmounts,
  pricePerShare,
  profitLoss,
  returnPercent,
} from '../primitives';

describe('pricePerShare', () => {
  it('derives the price the user never has to type', () => {
    expect(pricePerShare('12500', '200')).toBe('62.50');
  });

  it('handles an uneven division at money precision', () => {
    expect(pricePerShare('1000', '3')).toBe('333.33');
  });

  it('returns null rather than dividing by zero shares', () => {
    expect(pricePerShare('12500', '0')).toBeNull();
  });

  it('rejects an invalid amount', () => {
    expect(() => pricePerShare('abc', '200')).toThrow(InvalidFinancialValueError);
  });
});

describe('averageCost', () => {
  it('divides total invested by total shares', () => {
    expect(averageCost('78500', '1250')).toBe('62.80');
  });

  it('returns null when no shares are held', () => {
    expect(averageCost('0', '0')).toBeNull();
    expect(averageCost('78500', '0')).toBeNull();
  });
});

describe('currentValue', () => {
  it('multiplies shares by the market price', () => {
    expect(currentValue('1250', '65.25')).toBe('81562.50');
  });

  it('is unavailable without a price', () => {
    expect(currentValue('1250', null)).toBeNull();
  });

  it('is zero when no shares are held', () => {
    expect(currentValue('0', '65.25')).toBe('0.00');
  });
});

describe('profitLoss', () => {
  it('reports a gain', () => {
    expect(profitLoss('81562.50', '78500')).toBe('3062.50');
  });

  it('reports a loss as a negative value', () => {
    expect(profitLoss('76700', '78500')).toBe('-1800.00');
  });

  it('reports exactly zero when the value matches the cost', () => {
    expect(profitLoss('78500', '78500')).toBe('0.00');
  });

  it('is unavailable without a current value', () => {
    expect(profitLoss(null, '78500')).toBeNull();
  });
});

describe('returnPercent', () => {
  it('expresses profit as a percentage of the amount invested', () => {
    expect(returnPercent('3062.50', '78500')).toBe(3.9);
    expect(returnPercent('15200', '1250000')).toBe(1.22);
  });

  it('signs a loss negatively', () => {
    expect(returnPercent('-1800', '51428.57')).toBe(-3.5);
  });

  it('is zero for a flat position', () => {
    expect(returnPercent('0', '78500')).toBe(0);
  });

  it('returns null when nothing has been invested', () => {
    expect(returnPercent('0', '0')).toBeNull();
  });

  it('is unavailable without a profit figure', () => {
    expect(returnPercent(null, '78500')).toBeNull();
  });
});

describe('allocationPercent', () => {
  it('expresses a position as a share of the portfolio', () => {
    expect(allocationPercent('35000', '100000')).toBe(35);
  });

  it('returns null for an empty portfolio', () => {
    expect(allocationPercent('35000', '0')).toBeNull();
  });

  it('is unavailable when the position has no value', () => {
    expect(allocationPercent(null, '100000')).toBeNull();
  });
});

describe('netAmounts', () => {
  it('sums invested amounts and share counts without drift', () => {
    const result = netAmounts([
      { investedAmount: '12500.10', shares: '200.5' },
      { investedAmount: '7499.90', shares: '99.5' },
    ]);

    expect(result.totalInvested).toBe('20000.00');
    expect(result.totalShares).toBe('300');
  });

  it('returns zeroed totals for an empty set', () => {
    expect(netAmounts([])).toEqual({ totalInvested: '0.00', totalShares: '0' });
  });
});
