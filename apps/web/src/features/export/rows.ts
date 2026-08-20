import { averageCost, netAmounts, pricePerShare } from '@dcafolio/calculation';
import type { TransactionWithStock } from '@dcafolio/shared';

/**
 * The shape both export formats share.
 *
 * Values are raw decimal strings, not display-formatted: an export must
 * re-import cleanly into a spreadsheet, and thousands separators or a ฿ prefix
 * would turn every number into text.
 */
export type ExportRow = {
  date: string;
  stock: string;
  investedAmount: string;
  shares: string;
  pricePerShare: string;
};

export const EXPORT_COLUMNS = [
  'Date',
  'Stock',
  'Invested Amount',
  'Shares',
  'Price / Share',
] as const;

export function toExportRows(transactions: TransactionWithStock[]): ExportRow[] {
  return transactions.map((transaction) => ({
    date: transaction.purchaseDate,
    stock: transaction.stock.symbol,
    investedAmount: transaction.investedAmount,
    shares: transaction.shares,
    pricePerShare: pricePerShare(transaction.investedAmount, transaction.shares) ?? '',
  }));
}

export type ExportSummary = {
  totalInvested: string;
  totalShares: string;
  averageCost: string | null;
  transactionCount: number;
};

/** Computed by the calculation package, never re-derived here. */
export function summarise(transactions: TransactionWithStock[]): ExportSummary {
  const { totalInvested, totalShares } = netAmounts(transactions);

  return {
    totalInvested,
    totalShares,
    averageCost: averageCost(totalInvested, totalShares),
    transactionCount: transactions.length,
  };
}
