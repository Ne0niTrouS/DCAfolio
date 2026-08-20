import type { Market } from './constants';

/**
 * Domain types shared by the web app, the calculation engine and any future
 * client. Money and share quantities are decimal STRINGS, never `number`: they
 * come out of PostgreSQL `numeric` and must not lose precision on the way.
 */

export type Stock = {
  id: string;
  symbol: string;
  nameTh: string;
  market: Market;
  isActive: boolean;
};

export type Transaction = {
  id: string;
  userId: string;
  stockId: string;
  /** ISO calendar date, `YYYY-MM-DD`. */
  purchaseDate: string;
  /** Decimal string, THB. */
  investedAmount: string;
  /** Decimal string. */
  shares: string;
  createdAt: string;
  updatedAt: string;
};

/** A transaction with its stock resolved, as the UI and exports need it. */
export type TransactionWithStock = Transaction & { stock: Stock };

/**
 * How much a displayed price can be trusted.
 * - `fresh`   captured recently by the configured provider
 * - `stale`   the newest capture available, but old enough to warn about
 * - `missing` no capture at all; price-dependent figures are unavailable
 */
export type PriceStatus = 'fresh' | 'stale' | 'missing';

export type MarketPrice = {
  stockId: string;
  symbol: string;
  /** Decimal string, THB. */
  price: string;
  provider: string;
  /** ISO timestamp. */
  capturedAt: string;
  status: PriceStatus;
};

export type MarketState = 'open' | 'closed' | 'unknown';
