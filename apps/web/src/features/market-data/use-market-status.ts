import type { MarketStatus } from '@dcafolio/shared';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-client';

import { isClientResolvable, resolveMarketDataProvider } from './provider';

/**
 * Market open/closed state, straight from the configured provider.
 *
 * Kept separate from the price cache: a provider that cannot say whether the
 * SET is open still has usable prices, and vice versa. The mock provider
 * reports `unknown` rather than guessing.
 *
 * Disabled for a server-side provider such as `yahoo`, which the browser must
 * not call. Its answer arrives with the sync response instead, so the state
 * shown is the one that was true when prices were last fetched — and stays
 * `unknown` until somebody fetches them.
 */
export function useMarketStatus() {
  return useQuery<MarketStatus>({
    queryKey: queryKeys.marketStatus,
    queryFn: () => resolveMarketDataProvider().getMarketStatus(),
    enabled: isClientResolvable(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
