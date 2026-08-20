import { add } from '@dcafolio/calculation';
import type { TransactionWithStock } from '@dcafolio/shared';

export type InvestedPoint = {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Decimal string: everything invested up to and including this date. */
  total: string;
};

/**
 * Cumulative invested amount, one point per day on which a purchase happened.
 *
 * This is deliberately **invested**, not portfolio value: a value curve would
 * need a price for every past day, and the cache only holds the latest one.
 * Drawing it from today's price would invent history. What is charted here is a
 * fact — money the user actually put in, when they put it in.
 *
 * Money is summed with the decimal helpers, never with `+`.
 */
export function investedSeries(transactions: readonly TransactionWithStock[]): InvestedPoint[] {
  const byDate = new Map<string, string>();

  for (const transaction of transactions) {
    const running = byDate.get(transaction.purchaseDate);
    byDate.set(
      transaction.purchaseDate,
      running === undefined
        ? transaction.investedAmount
        : add(running, transaction.investedAmount).toString(),
    );
  }

  const dates = [...byDate.keys()].sort();
  const points: InvestedPoint[] = [];
  let total = '0';

  for (const date of dates) {
    total = add(total, byDate.get(date) as string).toString();
    points.push({ date, total });
  }

  return points;
}
