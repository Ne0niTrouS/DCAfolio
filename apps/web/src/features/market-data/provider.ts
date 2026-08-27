import type { MarketDataProvider } from '@dcafolio/shared';

import { env } from '@/lib/env';

import { MockMarketDataProvider } from './mock-provider';

/**
 * Resolves the configured provider.
 *
 * V1 ships only the mock provider: no free source of Thai SET quotes has been
 * verified against the criteria in docs/specs/market-data-providers.md. When
 * one is, it is registered here and nothing else in the app changes.
 *
 * An unknown configuration value falls back to the mock rather than throwing —
 * a misconfigured provider must degrade the price display, not break the app.
 */
const PROVIDERS: Record<string, () => MarketDataProvider> = {
  mock: () => new MockMarketDataProvider(),
};

export function resolveMarketDataProvider(
  providerId: string = env.marketDataProvider,
): MarketDataProvider {
  const factory = PROVIDERS[providerId];
  if (!factory) {
    console.warn(
      `Unknown market data provider "${providerId}"; falling back to the mock provider.`,
    );
    return PROVIDERS.mock!();
  }
  return factory();
}

/**
 * Whether the browser can run this provider itself.
 *
 * `yahoo` cannot: the request belongs on the server, where no CORS wall stands
 * in the way and the reader's own address is not handed to a third party. What
 * it knows reaches the app through the `market-data` Edge Function instead.
 */
export function isClientResolvable(providerId: string = env.marketDataProvider): boolean {
  return providerId in PROVIDERS;
}
