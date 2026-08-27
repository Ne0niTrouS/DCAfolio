import { describe, expect, it } from 'vitest';

import { syncMessage, type SyncResult } from '../use-sync-prices';

function result(overrides: Partial<SyncResult> = {}): SyncResult {
  return { provider: 'yahoo', captured: 0, stale: 0, ...overrides };
}

describe('syncMessage', () => {
  it('reports how many real prices arrived', () => {
    expect(syncMessage(result({ captured: 4 }))).toEqual({
      key: 'market.syncDone',
      params: { count: 4 },
    });
  });

  it('separates the fetched from the cached rather than adding them up', () => {
    // Reporting "6 updated" when two of them are last week's close would be a
    // lie about the only number that matters here.
    expect(syncMessage(result({ captured: 4, stale: 2 }))).toEqual({
      key: 'market.syncPartial',
      params: { count: 4, cached: 2 },
    });
  });

  it('says the market was shut when nothing fresh could exist', () => {
    expect(syncMessage(result({ stale: 3 }))).toEqual({
      key: 'market.syncCached',
      params: { count: 3 },
    });
  });

  it('names a provider failure instead of blaming the market', () => {
    expect(syncMessage(result({ stale: 3, providerFailed: true }))).toEqual({
      key: 'market.syncFailed',
      params: { count: 3 },
    });
  });

  it('says when the cooldown refused the request, and for how long', () => {
    expect(syncMessage(result({ skipped: true, retryInMinutes: 12 }))).toEqual({
      key: 'market.syncSkipped',
      params: { minutes: 12 },
    });
  });

  it('does not claim success for an empty portfolio', () => {
    expect(syncMessage(result())).toEqual({ key: 'market.syncNothing' });
  });
});
