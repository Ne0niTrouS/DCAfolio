import { describe, expect, it } from 'vitest';

import { relativeTimeParts, todayIsoDate } from '../format';

const NOW = new Date('2026-08-20T10:00:00.000Z');

describe('relativeTimeParts', () => {
  it('stays coarse, because what matters is whether a price is recent', () => {
    expect(relativeTimeParts('2026-08-20T09:59:30.000Z', NOW)).toEqual({ unit: 'justNow' });
    expect(relativeTimeParts('2026-08-20T09:55:00.000Z', NOW)).toEqual({
      unit: 'minutes',
      count: 5,
    });
    expect(relativeTimeParts('2026-08-20T09:00:00.000Z', NOW)).toEqual({
      unit: 'hours',
      count: 1,
    });
    expect(relativeTimeParts('2026-08-20T05:00:00.000Z', NOW)).toEqual({
      unit: 'hours',
      count: 5,
    });
    expect(relativeTimeParts('2026-08-19T09:00:00.000Z', NOW)).toEqual({
      unit: 'days',
      count: 1,
    });
    expect(relativeTimeParts('2026-08-10T09:00:00.000Z', NOW)).toEqual({
      unit: 'days',
      count: 10,
    });
  });

  it('treats a future timestamp as just now rather than reporting a negative age', () => {
    expect(relativeTimeParts('2026-08-20T11:00:00.000Z', NOW)).toEqual({ unit: 'justNow' });
  });

  it('reports nothing usable as null, leaving the dash to the caller', () => {
    expect(relativeTimeParts(null, NOW)).toBeNull();
    expect(relativeTimeParts(undefined, NOW)).toBeNull();
    expect(relativeTimeParts('not a timestamp', NOW)).toBeNull();
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
