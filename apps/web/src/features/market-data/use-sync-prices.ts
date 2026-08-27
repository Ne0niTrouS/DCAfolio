import type { MarketState } from '@dcafolio/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TranslationKey } from '@/i18n/en';
import { invokeEdgeFunction } from '@/lib/edge-function';
import { queryKeys } from '@/lib/query-client';

/** What the `market-data` Edge Function reports about one refresh. */
export type SyncResult = {
  provider: string;
  captured: number;
  stale: number;
  skipped?: boolean;
  retryInMinutes?: number;
  marketState?: MarketState;
  providerFailed?: boolean;
};

export type SyncMessage = {
  key: TranslationKey;
  params?: Record<string, string | number>;
};

/**
 * Says what a refresh actually achieved.
 *
 * Kept apart from the mutation because "how many prices are real" is exactly
 * the thing that must not be glossed over, and a pure function can be tested
 * against every combination the server can return. A refresh that fetched
 * nothing must never read like one that worked.
 */
export function syncMessage(result: SyncResult): SyncMessage {
  if (result.skipped) {
    return { key: 'market.syncSkipped', params: { minutes: result.retryInMinutes ?? 0 } };
  }

  if (result.captured === 0 && result.stale === 0) {
    return { key: 'market.syncNothing' };
  }

  if (result.captured === 0) {
    // Every price on screen is now a re-published cache entry, whether the
    // provider was down or the market simply shut.
    return {
      key: result.providerFailed ? 'market.syncFailed' : 'market.syncCached',
      params: { count: result.stale },
    };
  }

  if (result.stale > 0) {
    return { key: 'market.syncPartial', params: { count: result.captured, cached: result.stale } };
  }

  return { key: 'market.syncDone', params: { count: result.captured } };
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
