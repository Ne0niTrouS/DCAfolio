import {
  InvalidFinancialValueError,
  add,
  parseDecimal,
  roundMoney,
  safeDivide,
} from './decimal';

const ISO_MONTH = /^(\d{4})-(\d{2})-\d{2}/;

function monthKey(purchaseDate: string): string {
  const match = ISO_MONTH.exec(purchaseDate);
  if (!match) throw new InvalidFinancialValueError(purchaseDate, 'purchaseDate');
  return `${match[1]}-${match[2]}`;
}

/**
 * How many distinct calendar months contain at least one purchase.
 *
 * Deliberately not "months between the first and last purchase": a paused month
 * is not a month of DCA, and counting it would understate the real rate.
 */
export function distinctPurchaseMonths(
  transactions: readonly { purchaseDate: string }[],
): number {
  const months = new Set<string>();
  for (const transaction of transactions) {
    months.add(monthKey(transaction.purchaseDate));
  }
  return months.size;
}

/** Average amount invested per month that actually had a purchase. */
export function dcaPerMonth(
  transactions: readonly { purchaseDate: string; investedAmount: string }[],
): string | null {
  const months = distinctPurchaseMonths(transactions);
  if (months === 0) return null;

  const total = transactions.reduce(
    (sum, transaction) => add(sum, parseDecimal(transaction.investedAmount, 'investedAmount')),
    parseDecimal('0'),
  );

  // months is already known to be non-zero, so the null branch is unreachable;
  // safeDivide is still used so no division in this package can ever be unsafe.
  const perMonth = safeDivide(total, months);
  return perMonth === null ? null : roundMoney(perMonth);
}
