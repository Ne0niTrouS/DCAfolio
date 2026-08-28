import { describe, expect, it } from 'vitest';

import { AUTO_SYNC_INTERVAL_MINUTES, shouldAutoSync } from '../use-auto-sync';

const NOW = new Date('2026-08-28T12:00:00.000Z');

describe('shouldAutoSync', () => {
  it('syncs on the first sign-in of a browser', () => {
    expect(shouldAutoSync(null, NOW)).toBe(true);
  });

  it('does not sync again on a page reload moments later', () => {
    // The whole point: the dashboard must not reach the provider on every visit.
    expect(shouldAutoSync('2026-08-28T11:58:00.000Z', NOW)).toBe(false);
  });

  it('syncs again once the interval has passed', () => {
    expect(shouldAutoSync('2026-08-28T11:45:00.000Z', NOW)).toBe(true);
    expect(shouldAutoSync('2026-08-28T09:00:00.000Z', NOW)).toBe(true);
  });

  it('matches the interval boundary exactly', () => {
    const boundary = new Date(NOW.getTime() - AUTO_SYNC_INTERVAL_MINUTES * 60_000);

    expect(shouldAutoSync(boundary.toISOString(), NOW)).toBe(true);
  });

  it('is not locked out by a marker written in the future', () => {
    // A clock disagreement must not disable syncing until that time arrives.
    expect(shouldAutoSync('2026-08-28T13:00:00.000Z', NOW)).toBe(true);
  });

  it('ignores a corrupted marker rather than trusting it', () => {
    expect(shouldAutoSync('not a date', NOW)).toBe(true);
  });
});
