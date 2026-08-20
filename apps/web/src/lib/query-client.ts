import { QueryClient } from '@tanstack/react-query';

/** Query keys live in one place so an invalidation can never miss a consumer. */
export const queryKeys = {
  stocks: ['stocks'] as const,
  transactions: ['transactions'] as const,
  transactionList: (filters: unknown) => ['transactions', 'list', filters] as const,
  marketPrices: ['market-prices'] as const,
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Personal data changes only when this user changes it, so refetching
        // on every window focus is pure noise.
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
