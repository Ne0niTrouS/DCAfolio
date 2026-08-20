import type { Stock } from '@dcafolio/shared';

import type { TransactionFilters } from '@/features/transactions/queries';

export type ExportPeriod = 'all' | 'monthly' | 'yearly';
export type ExportFormat = 'csv' | 'xlsx';

export type ExportSelection = {
  /** `null` means every stock. */
  stockId: string | null;
  period: ExportPeriod;
  year?: number | undefined;
  /** 1–12. Only meaningful when `period` is `monthly`. */
  month?: number | undefined;
  format: ExportFormat;
};

function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, month, 0).getDate();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Inclusive ISO date bounds for the selected period, or none for all time. */
export function dateRangeFor(selection: ExportSelection): { from?: string; to?: string } {
  if (selection.period === 'all' || !selection.year) return {};

  if (selection.period === 'yearly') {
    return { from: `${selection.year}-01-01`, to: `${selection.year}-12-31` };
  }

  const month = selection.month ?? 1;
  return {
    from: `${selection.year}-${pad(month)}-01`,
    to: `${selection.year}-${pad(month)}-${pad(lastDayOfMonth(selection.year, month))}`,
  };
}

/**
 * The query filters for a selection.
 *
 * RLS already restricts every row to the signed-in user, so these are the
 * user's own narrowing choices — never the security boundary.
 */
export function filtersFor(selection: ExportSelection): TransactionFilters {
  const range = dateRangeFor(selection);
  return {
    stockId: selection.stockId ?? undefined,
    from: range.from,
    to: range.to,
  };
}

/** `dcafolio_CPALL_2026-08.xlsx`, `dcafolio_all_all-time.csv`. */
export function fileNameFor(selection: ExportSelection, stocks: Stock[]): string {
  const symbol =
    selection.stockId === null
      ? 'all'
      : (stocks.find((stock) => stock.id === selection.stockId)?.symbol ?? 'stock');

  let range = 'all-time';
  if (selection.year && selection.period === 'yearly') {
    range = String(selection.year);
  } else if (selection.year && selection.period === 'monthly') {
    range = `${selection.year}-${pad(selection.month ?? 1)}`;
  }

  return `dcafolio_${symbol}_${range}.${selection.format}`;
}
