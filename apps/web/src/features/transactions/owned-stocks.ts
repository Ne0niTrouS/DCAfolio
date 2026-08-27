import type { Stock, TransactionWithStock } from '@dcafolio/shared';

/**
 * The stocks the user actually holds, by symbol.
 *
 * Filters that list the whole master are a trap: most entries find nothing, and
 * the list gets longer every time the master grows. History and Export both
 * narrow to what has been bought.
 */
export function ownedStocks(transactions: readonly TransactionWithStock[]): Stock[] {
  const owned = new Map<string, Stock>();
  for (const transaction of transactions) {
    owned.set(transaction.stockId, transaction.stock);
  }
  return [...owned.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}
