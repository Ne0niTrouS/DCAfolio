// DCAfolio — Yahoo Finance quote parsing.
//
// Pure functions only: no fetch, no Deno globals, no I/O. That is deliberate.
// The Edge Function around this file cannot be run by Vitest, so everything
// that can get the numbers wrong lives here, where `supabase/tests/yahoo.test.ts`
// exercises it against recorded payloads.
//
// READ THIS BEFORE TRUSTING THE DATA. Yahoo publishes no free quote API. These
// endpoints are undocumented and unsupported, and DCAfolio uses them as an
// accepted risk recorded in context.md section 8 and
// docs/specs/market-data-providers.md. They can change shape or disappear
// without notice, which is why every parse below fails to `null` rather than
// guessing, and why the caller keeps serving the cached price when it does.

export const YAHOO_PROVIDER_ID = 'yahoo';

/** Yahoo's suffix for the Stock Exchange of Thailand. `PTT` is `PTT.BK`. */
export const SET_SUFFIX = '.BK';

/** The only currency a SET quote may be denominated in. */
export const EXPECTED_CURRENCY = 'THB';

/**
 * Minimum gap between two provider fetches.
 *
 * Not politeness — self-defence. A refresh button that reaches the provider on
 * every click burns an unmetered but very much finite welcome, and a browser
 * reload loop would do it unattended.
 */
export const SYNC_COOLDOWN_MINUTES = 15;

/**
 * Browser User-Agent, required rather than cosmetic.
 *
 * Measured 2026-08-27: an identical request with no User-Agent header returns
 * `429 Too Many Requests` on the first call, every time. With one it returns
 * `200`. Omitting it does not degrade the feature, it disables it.
 */
export const REQUEST_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export type Quote = {
  symbol: string;
  /** Decimal string, THB. */
  price: string;
  provider: string;
  /** ISO timestamp of when the exchange last traded this price. */
  capturedAt: string;
};

export type MarketState = 'open' | 'closed' | 'unknown';

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** `PTT` and `ptt.bk` both address the same listing. */
export function yahooSymbol(symbol: string): string {
  const trimmed = symbol.trim().toUpperCase();
  return trimmed.endsWith(SET_SUFFIX) ? trimmed : `${trimmed}${SET_SUFFIX}`;
}

export function quoteUrl(symbol: string): string {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol(symbol),
  )}?interval=1d&range=1d`;
}

/** The `chart.result[0].meta` object, or null for any payload that lacks it. */
function chartMeta(payload: unknown): Record<string, unknown> | null {
  const results = record(record(payload)?.['chart'])?.['result'];
  if (!Array.isArray(results)) return null;
  return record(record(results[0])?.['meta']);
}

/**
 * Turns a raw price into a 2-decimal string.
 *
 * Yahoo stores prices as 32-bit floats, so a baht-and-satang value arrives as
 * `1.2999999523162842`. The SET's smallest tick is 0.01, which makes rounding
 * to two decimals a repair rather than a loss of precision.
 */
export function toPriceString(value: number): string {
  return value.toFixed(2);
}

/**
 * Reads one quote, or returns `null` if anything at all is off.
 *
 * `null` is not an error path to be smoothed over: it is how a missing price
 * reaches the caller, which then republishes the cached value marked stale.
 * Inventing a number here would put a fabricated price in front of somebody
 * deciding what to buy.
 */
export function parseQuote(symbol: string, payload: unknown, now: Date): Quote | null {
  const meta = chartMeta(payload);
  if (!meta) return null;

  // A symbol that does not exist on the SET can still match a listing
  // elsewhere. Checking the currency stops a US dollar price being recorded as
  // baht and silently wrecking every profit figure that depends on it.
  if (meta['currency'] !== EXPECTED_CURRENCY) return null;

  const price = finiteNumber(meta['regularMarketPrice']);
  if (price === null || price <= 0) return null;

  return {
    symbol: symbol.trim().toUpperCase(),
    price: toPriceString(price),
    provider: YAHOO_PROVIDER_ID,
    // When DCAfolio captured it, which is what `captured_at` has always meant
    // here: `latest_market_prices` picks the newest row by this column and the
    // UI ages prices by it. Writing the exchange's own trade time instead would
    // sort a freshly fetched closing price behind an older row and hand the
    // dashboard the wrong number. How current the price itself is travels on
    // `is_stale` — see `staleFromMarketState`.
    capturedAt: now.toISOString(),
  };
}

/**
 * Whether a price fetched right now should be recorded as stale.
 *
 * A quote pulled while the SET is shut is the previous close however fresh the
 * request was, so it is flagged and the UI says "cached". Tied to the trading
 * window Yahoo reports rather than to an age threshold, because no number of
 * minutes tells a quiet Tuesday apart from a public holiday.
 */
export function staleFromMarketState(state: MarketState): boolean {
  return state !== 'open';
}

/**
 * Derives open/closed from the trading window Yahoo itself reports.
 *
 * Not from a hard-coded 10:00–16:30: that would call a public holiday a
 * trading day. Anything unreadable is `unknown`, never a guess.
 */
export function parseMarketState(payload: unknown, now: Date): MarketState {
  const regular = record(record(chartMeta(payload)?.['currentTradingPeriod'])?.['regular']);
  const start = finiteNumber(regular?.['start']);
  const end = finiteNumber(regular?.['end']);
  if (start === null || end === null || start >= end) return 'unknown';

  const seconds = now.getTime() / 1000;
  return seconds >= start && seconds < end ? 'open' : 'closed';
}

/**
 * Whole minutes left before the provider may be called again, 0 when it may.
 *
 * Deliberately counts from the newest cached row whether or not it was marked
 * stale, so a failing provider is not retried in a tight loop.
 */
export function cooldownRemainingMinutes(
  newestCapturedAt: string | null,
  now: Date,
  cooldownMinutes: number = SYNC_COOLDOWN_MINUTES,
): number {
  if (!newestCapturedAt) return 0;

  const captured = new Date(newestCapturedAt).getTime();
  if (!Number.isFinite(captured)) return 0;

  const elapsed = (now.getTime() - captured) / 60_000;
  // A timestamp in the future means a clock disagreement, not a fresh price.
  if (elapsed < 0) return 0;

  return elapsed >= cooldownMinutes ? 0 : Math.ceil(cooldownMinutes - elapsed);
}
