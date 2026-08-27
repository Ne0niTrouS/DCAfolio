import { describe, expect, it } from 'vitest';

import {
  cooldownRemainingMinutes,
  parseMarketState,
  parseQuote,
  quoteUrl,
  staleFromMarketState,
  toPriceString,
  yahooSymbol,
} from '../functions/_shared/yahoo.ts';

/**
 * Shaped from a real response recorded on 2026-08-27:
 * GET https://query1.finance.yahoo.com/v8/finance/chart/PTT.BK?interval=1d&range=1d
 *
 * Trimmed to the fields the parser reads. If Yahoo changes this shape the tests
 * here will keep passing while production breaks — that is the limit of a
 * recorded payload, and the reason every parse falls back to `null` rather than
 * to a guess.
 */
function payload(meta: Record<string, unknown>): unknown {
  return { chart: { result: [{ meta }], error: null } };
}

const OPEN_AT = 1_787_808_565; // inside the window below
const REGULAR = { start: 1_787_799_600, end: 1_787_823_000, timezone: 'ICT' };

const PTT = payload({
  currency: 'THB',
  symbol: 'PTT.BK',
  exchangeName: 'SET',
  regularMarketPrice: 40.25,
  regularMarketTime: OPEN_AT,
  currentTradingPeriod: { regular: REGULAR },
});

const NOW = new Date('2026-08-27T09:00:00.000Z');

describe('yahooSymbol', () => {
  it('appends the SET suffix', () => {
    expect(yahooSymbol('PTT')).toBe('PTT.BK');
  });

  it('leaves an already-suffixed symbol alone', () => {
    expect(yahooSymbol('PTT.BK')).toBe('PTT.BK');
  });

  it('normalises case and whitespace', () => {
    expect(yahooSymbol('  cpall  ')).toBe('CPALL.BK');
    expect(yahooSymbol('ptt.bk')).toBe('PTT.BK');
  });
});

describe('quoteUrl', () => {
  it('addresses the single-symbol chart endpoint', () => {
    expect(quoteUrl('PTT')).toBe(
      'https://query1.finance.yahoo.com/v8/finance/chart/PTT.BK?interval=1d&range=1d',
    );
  });

  it('escapes a symbol so it cannot alter the query string', () => {
    expect(quoteUrl('A&B')).toContain('/chart/A%26B.BK?');
  });
});

describe('toPriceString', () => {
  it('keeps two decimals', () => {
    expect(toPriceString(40.25)).toBe('40.25');
    expect(toPriceString(46)).toBe('46.00');
  });

  it('repairs 32-bit float noise', () => {
    // Yahoo stores prices as float32, so a clean 1.30 comes back like this.
    expect(toPriceString(1.2999999523162842)).toBe('1.30');
  });
});

describe('parseQuote', () => {
  it('reads the price, the provider and the capture time', () => {
    expect(parseQuote('PTT', PTT, NOW)).toEqual({
      symbol: 'PTT',
      price: '40.25',
      provider: 'yahoo',
      capturedAt: NOW.toISOString(),
    });
  });

  it('stamps when DCAfolio captured it, not when the exchange traded it', () => {
    // `latest_market_prices` orders by captured_at, so a closing price fetched
    // today must not sort behind a row written earlier today.
    const old = payload({
      currency: 'THB',
      regularMarketPrice: 40.25,
      regularMarketTime: 1_600_000_000,
      currentTradingPeriod: { regular: REGULAR },
    });

    expect(parseQuote('PTT', old, NOW)?.capturedAt).toBe(NOW.toISOString());
  });

  it('uppercases the symbol it was asked about', () => {
    expect(parseQuote('  ptt  ', PTT, NOW)?.symbol).toBe('PTT');
  });

  it('refuses a quote that is not in baht', () => {
    // A Thai ticker can collide with a listing elsewhere. Recording dollars as
    // baht would corrupt every profit figure downstream.
    const usd = payload({ currency: 'USD', regularMarketPrice: 40.25 });

    expect(parseQuote('PTT', usd, NOW)).toBeNull();
  });

  it.each([
    ['missing', undefined],
    ['zero', 0],
    ['negative', -5],
    ['not a number', 'forty'],
    ['not finite', Number.NaN],
  ])('refuses a %s price', (_label, price) => {
    const broken = payload({ currency: 'THB', regularMarketPrice: price });

    expect(parseQuote('PTT', broken, NOW)).toBeNull();
  });

  it.each([
    ['an unknown symbol', { chart: { result: null, error: { code: 'Not Found' } } }],
    ['an empty result list', { chart: { result: [] } }],
    ['a completely different shape', { something: 'else' }],
    ['a string', 'nope'],
    ['null', null],
  ])('returns null for %s', (_label, body) => {
    expect(parseQuote('PTT', body, NOW)).toBeNull();
  });
});

describe('parseMarketState', () => {
  it('reports open inside the trading window', () => {
    expect(parseMarketState(PTT, new Date(OPEN_AT * 1000))).toBe('open');
  });

  it('reports closed before the open', () => {
    expect(parseMarketState(PTT, new Date((REGULAR.start - 60) * 1000))).toBe('closed');
  });

  it('reports closed at and after the close', () => {
    expect(parseMarketState(PTT, new Date(REGULAR.end * 1000))).toBe('closed');
    expect(parseMarketState(PTT, new Date((REGULAR.end + 3600) * 1000))).toBe('closed');
  });

  it.each([
    ['the window is missing', payload({ currency: 'THB' })],
    [
      'the window is inverted',
      payload({ currentTradingPeriod: { regular: { start: 100, end: 50 } } }),
    ],
    ['the payload is unreadable', { nope: true }],
  ])('says unknown when %s rather than guessing', (_label, body) => {
    expect(parseMarketState(body, NOW)).toBe('unknown');
  });
});

describe('staleFromMarketState', () => {
  it('trusts a price fetched while the market is open', () => {
    expect(staleFromMarketState('open')).toBe(false);
  });

  it('marks a price fetched outside trading hours as cached', () => {
    // It is the previous close however fresh the request was.
    expect(staleFromMarketState('closed')).toBe(true);
    expect(staleFromMarketState('unknown')).toBe(true);
  });
});

describe('cooldownRemainingMinutes', () => {
  const now = new Date('2026-08-27T12:00:00.000Z');

  it('allows the first fetch when nothing is cached', () => {
    expect(cooldownRemainingMinutes(null, now)).toBe(0);
  });

  it('blocks a fetch moments after the last one', () => {
    expect(cooldownRemainingMinutes('2026-08-27T11:59:00.000Z', now)).toBe(14);
    expect(cooldownRemainingMinutes('2026-08-27T11:50:00.000Z', now)).toBe(5);
  });

  it('allows a fetch once the full cooldown has passed', () => {
    expect(cooldownRemainingMinutes('2026-08-27T11:45:00.000Z', now)).toBe(0);
    expect(cooldownRemainingMinutes('2026-08-27T10:00:00.000Z', now)).toBe(0);
  });

  it('does not lock the button out over a clock disagreement', () => {
    // A cached row stamped in the future would otherwise block refreshes until
    // that time arrived.
    expect(cooldownRemainingMinutes('2026-08-27T13:00:00.000Z', now)).toBe(0);
  });

  it('ignores an unparseable timestamp instead of blocking forever', () => {
    expect(cooldownRemainingMinutes('not a date', now)).toBe(0);
  });

  it('honours an explicit cooldown length', () => {
    expect(cooldownRemainingMinutes('2026-08-27T11:59:00.000Z', now, 30)).toBe(29);
  });
});
