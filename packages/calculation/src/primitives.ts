import {
  add,
  multiply,
  parseDecimal,
  roundMoney,
  roundPercent,
  roundShares,
  safeDivide,
  subtract,
  type NumericInput,
} from './decimal';

/**
 * The formulas the whole product rests on. Each returns a rounded decimal
 * string (money) or a number (percent), and `null` whenever the answer is
 * genuinely unavailable — no shares yet, nothing invested, no market price.
 * `null` is the honest answer; the UI renders it as an em dash.
 */

/** `invested / shares`. Never entered by the user, never stored. */
export function pricePerShare(
  investedAmount: NumericInput,
  shares: NumericInput,
): string | null {
  const result = safeDivide(
    parseDecimal(investedAmount, 'investedAmount'),
    parseDecimal(shares, 'shares'),
  );
  return result === null ? null : roundMoney(result);
}

/** `totalInvested / totalShares`. */
export function averageCost(
  totalInvested: NumericInput,
  totalShares: NumericInput,
): string | null {
  const result = safeDivide(
    parseDecimal(totalInvested, 'totalInvested'),
    parseDecimal(totalShares, 'totalShares'),
  );
  return result === null ? null : roundMoney(result);
}

/** `totalShares × currentPrice`. Unavailable when there is no price. */
export function currentValue(
  totalShares: NumericInput,
  currentPrice: NumericInput | null,
): string | null {
  if (currentPrice === null) return null;
  return roundMoney(multiply(totalShares, currentPrice));
}

/** `currentValue − totalInvested`. Unavailable when there is no current value. */
export function profitLoss(
  positionValue: NumericInput | null,
  totalInvested: NumericInput,
): string | null {
  if (positionValue === null) return null;
  return roundMoney(subtract(positionValue, totalInvested));
}

/** `profitLoss / totalInvested × 100`. Null when nothing has been invested. */
export function returnPercent(
  profit: NumericInput | null,
  totalInvested: NumericInput,
): number | null {
  if (profit === null) return null;
  const ratio = safeDivide(profit, parseDecimal(totalInvested, 'totalInvested'));
  return ratio === null ? null : roundPercent(multiply(ratio, 100));
}

/** `positionValue / portfolioValue × 100`. Null for an empty portfolio. */
export function allocationPercent(
  positionValue: NumericInput | null,
  portfolioValue: NumericInput,
): number | null {
  if (positionValue === null) return null;
  const ratio = safeDivide(positionValue, parseDecimal(portfolioValue, 'portfolioValue'));
  return ratio === null ? null : roundPercent(multiply(ratio, 100));
}

export type AmountAndShares = { investedAmount: NumericInput; shares: NumericInput };

/** Sums a set of purchases. The only place totals are produced. */
export function netAmounts(entries: readonly AmountAndShares[]): {
  totalInvested: string;
  totalShares: string;
} {
  let invested = parseDecimal('0');
  let shares = parseDecimal('0');

  for (const entry of entries) {
    invested = add(invested, parseDecimal(entry.investedAmount, 'investedAmount'));
    shares = add(shares, parseDecimal(entry.shares, 'shares'));
  }

  return { totalInvested: roundMoney(invested), totalShares: roundShares(shares) };
}
