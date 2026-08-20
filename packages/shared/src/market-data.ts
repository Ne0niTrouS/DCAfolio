import type { MarketState } from './types';

/**
 * The only surface the app knows about for market data.
 *
 * The dashboard and the calculation engine depend on this interface and never
 * on a concrete provider, so swapping a mock for a real feed — or one feed for
 * another — touches exactly one file.
 */

export type Quote = {
  symbol: string;
  /** Decimal string, THB. */
  price: string;
  provider: string;
  /** ISO timestamp of when the quote was captured. */
  capturedAt: string;
};

export type MarketStatus = {
  state: MarketState;
  provider: string;
  /** ISO timestamp, or null when the provider cannot say. */
  checkedAt: string | null;
};

export interface MarketDataProvider {
  /** Stable identifier stored alongside every cached price. */
  readonly id: string;
  /** `null` when the provider has no quote for that symbol. */
  getQuote(symbol: string): Promise<Quote | null>;
  /** Every requested symbol appears as a key, `null` where unavailable. */
  getQuotes(symbols: string[]): Promise<Record<string, Quote | null>>;
  getMarketStatus(): Promise<MarketStatus>;
}

/** Provider ids known to V1. `mock` is the documented default. */
export const MARKET_DATA_PROVIDER_IDS = ['mock'] as const;
export type MarketDataProviderId = (typeof MARKET_DATA_PROVIDER_IDS)[number];
