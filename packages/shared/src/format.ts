import { CURRENCY_SYMBOL, MONEY_DECIMALS, PERCENT_DECIMALS, SHARE_DECIMALS } from './constants';

/** Rendered when a value cannot be computed (e.g. no market price yet). */
export const UNAVAILABLE = '—';

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function group(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** `฿1,265,200.00`. Returns `—` for missing or non-finite input. */
export function formatMoney(
  value: string | number | null | undefined,
  decimals: number = MONEY_DECIMALS,
): string {
  const parsed = toNumber(value);
  if (parsed === null) return UNAVAILABLE;
  const sign = parsed < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL}${group(Math.abs(parsed), decimals)}`;
}

/**
 * `+฿15,200.00` / `-฿1,800.00`. The sign is always explicit so profit and loss
 * never depend on colour alone.
 */
export function formatSignedMoney(
  value: string | number | null | undefined,
  decimals: number = MONEY_DECIMALS,
): string {
  const parsed = toNumber(value);
  if (parsed === null) return UNAVAILABLE;
  const sign = parsed > 0 ? '+' : parsed < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL}${group(Math.abs(parsed), decimals)}`;
}

/** `1,250.0000`, trailing zeros trimmed to keep whole share counts readable. */
export function formatShares(value: string | number | null | undefined): string {
  const parsed = toNumber(value);
  if (parsed === null) return UNAVAILABLE;
  return group(parsed, SHARE_DECIMALS).replace(/\.?0+$/, '');
}

/** `+1.22%` / `-3.50%`. */
export function formatSignedPercent(
  value: number | null | undefined,
  decimals: number = PERCENT_DECIMALS,
): string {
  const parsed = toNumber(value);
  if (parsed === null) return UNAVAILABLE;
  const sign = parsed > 0 ? '+' : parsed < 0 ? '-' : '';
  return `${sign}${group(Math.abs(parsed), decimals)}%`;
}

/** `35.00%` — unsigned, used for portfolio allocation. */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = PERCENT_DECIMALS,
): string {
  const parsed = toNumber(value);
  if (parsed === null) return UNAVAILABLE;
  return `${group(parsed, decimals)}%`;
}

/** `09/08/2026` from an ISO `YYYY-MM-DD` date, without timezone drift. */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return UNAVAILABLE;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return UNAVAILABLE;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Today as an ISO `YYYY-MM-DD` string in the viewer's local timezone.
 *
 * `toISOString()` is deliberately avoided: it converts to UTC, which shows
 * yesterday's date for anyone in Bangkok (UTC+7) before 07:00.
 */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
