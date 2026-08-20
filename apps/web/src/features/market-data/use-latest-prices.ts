import { MARKET_PRICE_STALE_AFTER_MINUTES, type MarketPrice } from '@dcafolio/shared';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

export type LatestPriceRow = {
  stock_id: string;
  symbol: string;
  price: string | number;
  provider: string;
  captured_at: string;
  is_stale: boolean;
};

/**
 * Staleness is decided at read time, not only when the row was written.
 *
 * If the refresh job stops, a row flagged fresh yesterday is still yesterday's
 * price — so age is what the UI trusts, and `is_stale` can only make a price
 * more suspect, never less.
 */
export function resolvePriceStatus(
  capturedAt: string,
  isStale: boolean,
  now: Date = new Date(),
): 'fresh' | 'stale' {
  if (isStale) return 'stale';

  const ageMinutes = (now.getTime() - new Date(capturedAt).getTime()) / 60_000;
  if (!Number.isFinite(ageMinutes)) return 'stale';

  return ageMinutes > MARKET_PRICE_STALE_AFTER_MINUTES ? 'stale' : 'fresh';
}

export function mapLatestPrice(row: LatestPriceRow, now: Date = new Date()): MarketPrice {
  return {
    stockId: row.stock_id,
    symbol: row.symbol,
    price: typeof row.price === 'string' ? row.price : String(row.price),
    provider: row.provider,
    capturedAt: row.captured_at,
    status: resolvePriceStatus(row.captured_at, row.is_stale, now),
  };
}

export async function fetchLatestPrices(): Promise<MarketPrice[]> {
  const { data, error } = await supabase
    .from('latest_market_prices')
    .select('stock_id, symbol, price::text, provider, captured_at, is_stale');

  if (error) throw error;

  const now = new Date();
  return (data as unknown as LatestPriceRow[]).map((row) => mapLatestPrice(row, now));
}

/**
 * The browser never calls a market-data provider directly: it reads the cache
 * the Edge Function writes. That keeps API secrets server-side and keeps the
 * dashboard working when the provider is down.
 */
export function useLatestPrices() {
  return useQuery({
    queryKey: queryKeys.marketPrices,
    queryFn: fetchLatestPrices,
    staleTime: 60_000,
  });
}

/** Indexes prices by stock id for the position lookup. */
export function byStockId(prices: MarketPrice[]): Map<string, MarketPrice> {
  return new Map(prices.map((price) => [price.stockId, price]));
}
