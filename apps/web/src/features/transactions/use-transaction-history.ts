import type { TransactionWithStock } from '@dcafolio/shared';
import { useMemo, useState } from 'react';

import { useTransactions, type TransactionFilters } from './queries';

export type HistoryFilters = TransactionFilters & { search?: string | undefined };

export const EMPTY_FILTERS: HistoryFilters = {};

/**
 * Free-text search runs in the browser, over the rows the server already
 * returned: it spans symbol and Thai name, and the personal data set is small
 * enough that a round trip per keystroke would be worse than useless.
 * Stock and date filters stay server-side so they narrow the query itself.
 */
export function searchTransactions(
  transactions: TransactionWithStock[],
  search: string | undefined,
): TransactionWithStock[] {
  const term = search?.trim().toLowerCase();
  if (!term) return transactions;

  return transactions.filter(
    (transaction) =>
      transaction.stock.symbol.toLowerCase().includes(term) ||
      transaction.stock.nameTh.toLowerCase().includes(term),
  );
}

export function useTransactionHistory() {
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);

  const query = useTransactions({
    stockId: filters.stockId,
    from: filters.from,
    to: filters.to,
  });

  const all = useMemo(() => query.data ?? [], [query.data]);
  const transactions = useMemo(
    () => searchTransactions(all, filters.search),
    [all, filters.search],
  );

  const hasFilters = Boolean(
    filters.stockId || filters.from || filters.to || filters.search?.trim(),
  );

  return {
    filters,
    setFilters,
    clearFilters: () => setFilters(EMPTY_FILTERS),
    hasFilters,
    transactions,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    /** No transactions exist at all — distinct from "no match for these filters". */
    isEmpty: !query.isLoading && !hasFilters && all.length === 0,
    hasNoMatches: !query.isLoading && hasFilters && transactions.length === 0,
  };
}
