import type { MarketStatus } from '@dcafolio/shared';
import { useQuery } from '@tanstack/react-query';

import { resolveMarketDataProvider } from './provider';

/**
 * Market open/closed state, straight from the configured provider.
 *
 * Kept separate from the price cache: a provider that cannot say whether the
 * SET is open still has usable prices, and vice versa. The mock provider
 * reports `unknown` rather than guessing.
 */
export function useMarketStatus() {
  return useQuery<MarketStatus>({
    queryKey: ['market-status'],
    queryFn: () => resolveMarketDataProvider().getMarketStatus(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
