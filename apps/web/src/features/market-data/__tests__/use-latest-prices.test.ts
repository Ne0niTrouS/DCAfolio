import { describe, expect, it } from 'vitest';

import { mapLatestPrice, resolvePriceStatus } from '../use-latest-prices';

const NOW = new Date('2026-08-20T10:00:00.000Z');

describe('resolvePriceStatus', () => {
  it('treats a recent capture as fresh', () => {
    expect(resolvePriceStatus('2026-08-20T09:45:00.000Z', false, NOW)).toBe('fresh');
  });

  it('treats an old capture as stale even when nothing flagged it', () => {
    expect(resolvePriceStatus('2026-08-20T09:00:00.000Z', false, NOW)).toBe('stale');
    expect(resolvePriceStatus('2026-08-19T10:00:00.000Z', false, NOW)).toBe('stale');
  });

  it('never upgrades a flagged price back to fresh', () => {
    expect(resolvePriceStatus('2026-08-20T09:59:00.000Z', true, NOW)).toBe('stale');
  });

  it('treats an unparseable timestamp as stale rather than trusting it', () => {
    expect(resolvePriceStatus('not a date', false, NOW)).toBe('stale');
  });
});

describe('mapLatestPrice', () => {
  const row = {
    stock_id: 'stock-cpall',
    symbol: 'CPALL',
    price: '65.2500',
    provider: 'mock',
    captured_at: '2026-08-20T09:50:00.000Z',
    is_stale: false,
  };

  it('keeps the price as a decimal string', () => {
    expect(mapLatestPrice(row, NOW)).toEqual({
      stockId: 'stock-cpall',
      symbol: 'CPALL',
      price: '65.2500',
      provider: 'mock',
      capturedAt: '2026-08-20T09:50:00.000Z',
      status: 'fresh',
    });
  });

  it('normalises a numeric response', () => {
    expect(mapLatestPrice({ ...row, price: 65.25 }, NOW).price).toBe('65.25');
  });
});
