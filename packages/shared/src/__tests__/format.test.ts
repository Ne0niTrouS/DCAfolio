import { describe, expect, it } from 'vitest';

import { APP_CREDIT, APP_NAME, SUPPORTED_MARKETS } from '../constants';
import {
  UNAVAILABLE,
  formatDate,
  formatMoney,
  formatPercent,
  formatShares,
  formatSignedMoney,
  formatSignedPercent,
} from '../format';

describe('constants', () => {
  it('carries the product identity', () => {
    expect(APP_NAME).toBe('DCAfolio');
    expect(APP_CREDIT).toBe('NeOniTrouS');
  });

  it('supports only the Thai SET market in V1', () => {
    expect(SUPPORTED_MARKETS).toEqual(['SET']);
  });
});

describe('formatMoney', () => {
  it('formats baht with thousands separators and two decimals', () => {
    expect(formatMoney('1265200')).toBe('฿1,265,200.00');
    expect(formatMoney(62.5)).toBe('฿62.50');
  });

  it('places the minus sign before the currency symbol', () => {
    expect(formatMoney('-1800')).toBe('-฿1,800.00');
  });

  it('renders unavailable values as a dash', () => {
    expect(formatMoney(null)).toBe(UNAVAILABLE);
    expect(formatMoney(undefined)).toBe(UNAVAILABLE);
    expect(formatMoney('')).toBe(UNAVAILABLE);
    expect(formatMoney('not a number')).toBe(UNAVAILABLE);
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe(UNAVAILABLE);
  });
});

describe('formatSignedMoney', () => {
  it('always shows an explicit sign for non-zero values', () => {
    expect(formatSignedMoney('15200')).toBe('+฿15,200.00');
    expect(formatSignedMoney('-1800')).toBe('-฿1,800.00');
  });

  it('shows no sign for exactly zero', () => {
    expect(formatSignedMoney('0')).toBe('฿0.00');
  });
});

describe('formatShares', () => {
  it('trims trailing zeros from whole share counts', () => {
    expect(formatShares('1250')).toBe('1,250');
    expect(formatShares('200.5')).toBe('200.5');
  });

  it('renders missing share counts as a dash', () => {
    expect(formatShares(null)).toBe(UNAVAILABLE);
  });
});

describe('percent formatting', () => {
  it('signs profit and loss explicitly', () => {
    expect(formatSignedPercent(1.22)).toBe('+1.22%');
    expect(formatSignedPercent(-3.5)).toBe('-3.50%');
    expect(formatSignedPercent(0)).toBe('0.00%');
  });

  it('leaves allocation percentages unsigned', () => {
    expect(formatPercent(35)).toBe('35.00%');
    expect(formatPercent(null)).toBe(UNAVAILABLE);
  });
});

describe('formatDate', () => {
  it('renders an ISO date as DD/MM/YYYY without timezone drift', () => {
    expect(formatDate('2026-08-09')).toBe('09/08/2026');
    expect(formatDate('2026-08-09T00:00:00Z')).toBe('09/08/2026');
  });

  it('rejects unparseable input', () => {
    expect(formatDate('09/08/2026')).toBe(UNAVAILABLE);
    expect(formatDate(null)).toBe(UNAVAILABLE);
  });
});
