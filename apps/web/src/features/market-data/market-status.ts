import type { MarketPrice } from '@dcafolio/shared';

import type { TranslationKey } from '@/i18n/en';

import type { SyncResult } from './use-sync-prices';

/**
 * How current the cached prices are, and how a refresh went.
 *
 * Pure and separate from the component because these are the statements most
 * worth getting wrong-proof: showing "updated just now" after a request that
 * failed, or calling a week-old close fresh, misleads about the only number on
 * the dashboard the user did not enter themselves.
 */

export type Freshness =
  | { kind: 'none' }
  /** The price query failed, so nothing can be said about age either way. */
  | { kind: 'unavailable' }
  | { kind: 'fresh'; capturedAt: string }
  | { kind: 'stale'; capturedAt: string };

/** Human-facing severity, so the icon and the wording cannot disagree. */
export type Tone = 'ok' | 'warn' | 'error' | 'busy';

export type SyncState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; captured: number; total: number }
  | { kind: 'partial'; captured: number; total: number }
  | { kind: 'skipped'; retryInMinutes: number }
  | { kind: 'error'; key: TranslationKey };

/** The newest capture across every priced holding, or null when none exist. */
export function newestPrice(prices: readonly MarketPrice[]): MarketPrice | null {
  return prices.reduce<MarketPrice | null>(
    (latest, price) => (!latest || price.capturedAt > latest.capturedAt ? price : latest),
    null,
  );
}

/**
 * Whether what is on screen can be trusted as current.
 *
 * `queryFailed` degrades a fresh reading to stale rather than hiding it: the
 * prices shown are whatever was last loaded, and a failed refetch means nobody
 * can vouch for them any more.
 */
export function freshnessOf(prices: readonly MarketPrice[], queryFailed = false): Freshness {
  const latest = newestPrice(prices);

  // Nothing loaded *and* the request failed is not the same as nothing stored.
  // Saying "no price data yet" there would report as fact something this
  // session was simply unable to find out.
  if (!latest) return queryFailed ? { kind: 'unavailable' } : { kind: 'none' };

  const stale = queryFailed || prices.some((price) => price.status === 'stale');
  return { kind: stale ? 'stale' : 'fresh', capturedAt: latest.capturedAt };
}

/**
 * What the last refresh achieved, from the server's own numbers.
 *
 * `captured` is prices that came back live; `stale` is holdings that fell back
 * to a re-published cache entry. Adding them together and calling the sum
 * "updated" is the specific lie this exists to prevent.
 */
export function syncStateFrom(
  result: SyncResult | undefined,
  errorKey: TranslationKey | null,
  isPending: boolean,
): SyncState {
  if (isPending) return { kind: 'loading' };
  if (errorKey) return { kind: 'error', key: errorKey };
  if (!result) return { kind: 'idle' };

  if (result.skipped) {
    return { kind: 'skipped', retryInMinutes: result.retryInMinutes ?? 0 };
  }

  const total = result.captured + result.stale;
  if (total === 0) return { kind: 'idle' };

  if (result.captured === 0) return { kind: 'error', key: 'market.syncFailed' };

  return {
    kind: result.stale > 0 ? 'partial' : 'success',
    captured: result.captured,
    total,
  };
}

export function toneOf(state: SyncState): Tone {
  switch (state.kind) {
    case 'loading':
      return 'busy';
    case 'success':
      return 'ok';
    case 'partial':
    case 'skipped':
      return 'warn';
    case 'error':
      return 'error';
    default:
      return 'ok';
  }
}

/**
 * Display name for a data source.
 *
 * A brand name, so it is not translated. Anything unrecognised falls through as
 * its own id rather than being hidden — an unnamed source is worse than an
 * ugly one.
 */
const PROVIDER_LABEL: Record<string, string> = {
  yahoo: 'Yahoo Finance',
  mock: 'Mock provider',
};

export function providerLabel(provider: string | null): string | null {
  if (!provider) return null;
  return PROVIDER_LABEL[provider] ?? provider;
}
