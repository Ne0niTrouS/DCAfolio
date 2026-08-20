import { describe, expect, it } from 'vitest';

import { UNAVAILABLE, formatRelativeTime, todayIsoDate } from '../format';

const NOW = new Date('2026-08-20T10:00:00.000Z');

describe('formatRelativeTime', () => {
  it('stays coarse, because what matters is whether a price is recent', () => {
    expect(formatRelativeTime('2026-08-20T09:59:30.000Z', NOW)).toBe('just now');
    expect(formatRelativeTime('2026-08-20T09:55:00.000Z', NOW)).toBe('5 min ago');
    expect(formatRelativeTime('2026-08-20T09:00:00.000Z', NOW)).toBe('1 hour ago');
    expect(formatRelativeTime('2026-08-20T05:00:00.000Z', NOW)).toBe('5 hours ago');
    expect(formatRelativeTime('2026-08-19T09:00:00.000Z', NOW)).toBe('1 day ago');
    expect(formatRelativeTime('2026-08-10T09:00:00.000Z', NOW)).toBe('10 days ago');
  });

  it('treats a future timestamp as just now rather than showing a negative age', () => {
    expect(formatRelativeTime('2026-08-20T11:00:00.000Z', NOW)).toBe('just now');
  });

  it('renders nothing usable as a dash', () => {
    expect(formatRelativeTime(null, NOW)).toBe(UNAVAILABLE);
    expect(formatRelativeTime('not a timestamp', NOW)).toBe(UNAVAILABLE);
  });
});

describe('todayIsoDate', () => {
  it('uses the local calendar day, not the UTC one', () => {
    // 07:00 in Bangkok on the 20th is 00:00 UTC on the 20th; an hour earlier
    // local time is still the 20th locally but the 19th in UTC.
    const localMorning = new Date(2026, 7, 20, 6, 30);

    expect(todayIsoDate(localMorning)).toBe('2026-08-20');
  });

  it('pads single-digit months and days', () => {
    expect(todayIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
