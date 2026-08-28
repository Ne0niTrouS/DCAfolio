import type { MarketState } from '@dcafolio/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TranslationKey } from '@/i18n/en';
import { EdgeFunctionError, invokeEdgeFunction } from '@/lib/edge-function';
import { queryKeys } from '@/lib/query-client';

/** What the `market-data` Edge Function reports about one refresh. */
export type SyncResult = {
  provider: string;
  /** Prices that came back live from the provider. */
  captured: number;
  /** Holdings that fell back to a re-published cache entry. */
  stale: number;
  skipped?: boolean;
  retryInMinutes?: number;
  marketState?: MarketState;
  providerFailed?: boolean;
};

/** The phrase key behind a failed sync, or null when it did not fail. */
export function syncErrorKey(error: unknown): TranslationKey | null {
  if (!error) return null;
  return error instanceof EdgeFunctionError ? error.key : 'error.generic';
}

export function syncPrices(): Promise<SyncResult> {
  return invokeEdgeFunction<SyncResult>('market-data');
}

/**
 * Fetches fresh prices on demand.
 *
 * The Edge Function enforces its own cooldown, so a fast second click comes
 * back as `skipped` rather than reaching the provider. That check belongs on
 * the server: disabling the button here would do nothing about a reload loop.
 */
export function useSyncPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncPrices,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketPrices });

      // Open or closed is only known as of the moment the provider was asked,
      // so it is recorded here rather than fetched on its own schedule.
      if (result.marketState && result.marketState !== 'unknown') {
        queryClient.setQueryData(queryKeys.marketStatus, {
          state: result.marketState,
          provider: result.provider,
          checkedAt: new Date().toISOString(),
        });
      }
    },
  });
}
