import type { MarketPrice } from '@dcafolio/shared';
import { describe, expect, it } from 'vitest';

import { freshnessOf, newestPrice, providerLabel, syncStateFrom } from '../market-status';
import type { SyncResult } from '../use-sync-prices';

function price(overrides: Partial<MarketPrice> = {}): MarketPrice {
  return {
    stockId: 'stock-ptt',
    symbol: 'PTT',
    price: '40.25',
    provider: 'yahoo',
    capturedAt: '2026-08-27T09:00:00.000Z',
    status: 'fresh',
    ...overrides,
  };
}

function result(overrides: Partial<SyncResult> = {}): SyncResult {
  return { provider: 'yahoo', captured: 0, stale: 0, ...overrides };
}

describe('newestPrice', () => {
  it('finds the most recent capture', () => {
    const latest = price({ capturedAt: '2026-08-27T10:00:00.000Z', symbol: 'AOT' });

    expect(newestPrice([price(), latest, price()])?.symbol).toBe('AOT');
  });

  it('has nothing to report for an empty cache', () => {
    expect(newestPrice([])).toBeNull();
  });
});

describe('freshnessOf', () => {
  it('reports nothing cached at all', () => {
    expect(freshnessOf([])).toEqual({ kind: 'none' });
  });

  it('trusts prices that are all fresh', () => {
    expect(freshnessOf([price(), price()])).toEqual({
      kind: 'fresh',
      capturedAt: '2026-08-27T09:00:00.000Z',
    });
  });

  it('is only as fresh as its stalest price', () => {
    // One cached holding makes the whole reading suspect: the reader cannot
    // tell which figure on the dashboard came from which.
    expect(freshnessOf([price(), price({ status: 'stale' })]).kind).toBe('stale');
  });

  it('treats a failed refetch as stale even when the loaded prices looked fresh', () => {
    // Nobody can vouch for what is on screen once the refetch failed.
    expect(freshnessOf([price()], true).kind).toBe('stale');
  });
});

describe('syncStateFrom', () => {
  it('is idle before anything has been asked for', () => {
    expect(syncStateFrom(undefined, null, false)).toEqual({ kind: 'idle' });
  });

  it('reports loading while the request is in flight', () => {
    expect(syncStateFrom(undefined, null, true)).toEqual({ kind: 'loading' });
  });

  it('reports loading even when a previous attempt failed', () => {
    // The stale error must not outrank the request now running.
    expect(syncStateFrom(undefined, 'error.network', true)).toEqual({ kind: 'loading' });
  });

  it('counts only live prices as updated', () => {
    expect(syncStateFrom(result({ captured: 3 }), null, false)).toEqual({
      kind: 'success',
      captured: 3,
      total: 3,
    });
  });

  it('does not add cached holdings into the updated count', () => {
    // "5/5 updated" for three live prices and two re-published cache entries is
    // the specific claim this exists to prevent.
    expect(syncStateFrom(result({ captured: 3, stale: 2 }), null, false)).toEqual({
      kind: 'partial',
      captured: 3,
      total: 5,
    });
  });

  it('refuses to call a refresh successful when nothing was fetched', () => {
    expect(syncStateFrom(result({ stale: 3 }), null, false)).toEqual({
      kind: 'error',
      key: 'market.syncFailed',
    });
  });

  it('reports the cooldown rather than a success', () => {
    expect(syncStateFrom(result({ skipped: true, retryInMinutes: 12 }), null, false)).toEqual({
      kind: 'skipped',
      retryInMinutes: 12,
    });
  });

  it('surfaces a request that failed outright', () => {
    expect(syncStateFrom(undefined, 'error.network', false)).toEqual({
      kind: 'error',
      key: 'error.network',
    });
  });

  it('stays idle for a portfolio with nothing to price', () => {
    expect(syncStateFrom(result(), null, false)).toEqual({ kind: 'idle' });
  });
});

describe('providerLabel', () => {
  it('names a known source properly', () => {
    expect(providerLabel('yahoo')).toBe('Yahoo Finance');
  });

  it('shows an unknown source rather than hiding it', () => {
    expect(providerLabel('some-new-feed')).toBe('some-new-feed');
  });

  it('has nothing to name when no price has a provider', () => {
    expect(providerLabel(null)).toBeNull();
  });
});
