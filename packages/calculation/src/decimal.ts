import DecimalJs from 'decimal.js';

import { MONEY_DECIMALS, PERCENT_DECIMALS, SHARE_DECIMALS } from '@dcafolio/shared';

/**
 * Money is never computed with binary floating point: 0.1 + 0.2 !== 0.3, and a
 * portfolio that is off by a satang is a portfolio nobody trusts. Every
 * authoritative figure in DCAfolio goes through this module.
 *
 * Half away from zero matches how a person rounds a bank statement, and keeps
 * gains and losses symmetric.
 */
export const Decimal = DecimalJs.clone({
  precision: 40,
  rounding: DecimalJs.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 30,
});

export type Decimal = InstanceType<typeof Decimal>;

/** Anything accepted as a financial input. Decimal strings are preferred. */
export type NumericInput = string | number | Decimal;

export class InvalidFinancialValueError extends Error {
  constructor(value: unknown, field?: string) {
    const where = field ? ` for ${field}` : '';
    super(`Invalid financial value${where}: ${String(value)}`);
    this.name = 'InvalidFinancialValueError';
  }
}

/**
 * Parses a financial value, or throws. Nothing is silently coerced: a bad value
 * must surface as an error rather than travel through the system as NaN.
 */
export function parseDecimal(value: NumericInput, field?: string): Decimal {
  if (value instanceof Decimal) {
    if (!value.isFinite()) throw new InvalidFinancialValueError(value, field);
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new InvalidFinancialValueError(value, field);
    return new Decimal(value);
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new InvalidFinancialValueError(value, field);
  }

  let parsed: Decimal;
  try {
    parsed = new Decimal(value.trim());
  } catch {
    throw new InvalidFinancialValueError(value, field);
  }

  if (!parsed.isFinite()) throw new InvalidFinancialValueError(value, field);
  return parsed;
}

export function add(a: NumericInput, b: NumericInput): Decimal {
  return parseDecimal(a).plus(parseDecimal(b));
}

export function subtract(a: NumericInput, b: NumericInput): Decimal {
  return parseDecimal(a).minus(parseDecimal(b));
}

export function multiply(a: NumericInput, b: NumericInput): Decimal {
  return parseDecimal(a).times(parseDecimal(b));
}

/**
 * Division that cannot produce NaN or Infinity.
 *
 * A zero denominator is a legitimate state in this product — a position with no
 * shares, a portfolio with nothing invested — so it returns `null`, which the
 * UI renders as an em dash, rather than throwing.
 */
export function safeDivide(numerator: NumericInput, denominator: NumericInput): Decimal | null {
  const bottom = parseDecimal(denominator, 'denominator');
  const top = parseDecimal(numerator, 'numerator');
  if (bottom.isZero()) return null;
  return top.dividedBy(bottom);
}

export function isPositive(value: NumericInput): boolean {
  return parseDecimal(value).greaterThan(0);
}

/** Money, as a fixed 2-decimal string. */
export function roundMoney(value: NumericInput): string {
  return parseDecimal(value).toFixed(MONEY_DECIMALS, DecimalJs.ROUND_HALF_UP);
}

/** Shares, at most 4 decimals, with trailing zeros dropped. */
export function roundShares(value: NumericInput): string {
  return new Decimal(
    parseDecimal(value).toFixed(SHARE_DECIMALS, DecimalJs.ROUND_HALF_UP),
  ).toString();
}

/** Percentages leave the package as plain numbers — they are never money. */
export function roundPercent(value: NumericInput): number {
  return Number(parseDecimal(value).toFixed(PERCENT_DECIMALS, DecimalJs.ROUND_HALF_UP));
}

export function toPercentNumber(value: Decimal): number {
  return roundPercent(value);
}
