import { computePortfolio, type PositionInput } from '@dcafolio/calculation';
import type { MarketPrice, TransactionWithStock } from '@dcafolio/shared';
import { useMemo } from 'react';

import { byStockId, useLatestPrices } from '@/features/market-data/use-latest-prices';
import { useTransactions } from '@/features/transactions/queries';

/**
 * Turns transactions plus cached prices into calculation inputs.
 *
 * All arithmetic stays in `@dcafolio/calculation`; this module only shapes
 * data, so no component ever does financial maths.
 */
export function toPositionInputs(
  transactions: TransactionWithStock[],
  prices: MarketPrice[],
): PositionInput[] {
  const priceByStock = byStockId(prices);
  const grouped = new Map<string, PositionInput>();

  for (const transaction of transactions) {
    let position = grouped.get(transaction.stockId);

    if (!position) {
      const price = priceByStock.get(transaction.stockId);
      position = {
        stockId: transaction.stockId,
        symbol: transaction.stock.symbol,
        nameTh: transaction.stock.nameTh,
        transactions: [],
        price:
          price && price.status !== 'missing'
            ? {
                price: price.price,
                provider: price.provider,
                capturedAt: price.capturedAt,
                status: price.status,
              }
            : null,
      };
      grouped.set(transaction.stockId, position);
    }

    (position.transactions as PositionInput['transactions'][number][]).push({
      purchaseDate: transaction.purchaseDate,
      investedAmount: transaction.investedAmount,
      shares: transaction.shares,
    });
  }

  return [...grouped.values()];
}

export function usePortfolio() {
  const transactionsQuery = useTransactions();
  const pricesQuery = useLatestPrices();

  const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
  const prices = useMemo(() => pricesQuery.data ?? [], [pricesQuery.data]);

  const portfolio = useMemo(
    () => computePortfolio(toPositionInputs(transactions, prices)),
    [transactions, prices],
  );

  return {
    portfolio,
    transactions,
    // Only the transaction query gates the page. A market-data failure must
    // degrade the display, never blank the dashboard.
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    refetch: transactionsQuery.refetch,
    pricesFailed: pricesQuery.isError,
    isEmpty: !transactionsQuery.isLoading && transactions.length === 0,
  };
}
