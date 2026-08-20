import type { PriceStatus } from '@dcafolio/shared';

import { dcaPerMonth } from './dca';
import { add, parseDecimal, roundMoney, roundShares } from './decimal';
import {
  allocationPercent,
  averageCost,
  currentValue,
  netAmounts,
  profitLoss,
  returnPercent,
} from './primitives';

export type PurchaseInput = {
  /** ISO calendar date, `YYYY-MM-DD`. */
  purchaseDate: string;
  investedAmount: string;
  shares: string;
};

export type PriceInput = {
  price: string;
  provider: string;
  capturedAt: string;
  status: Exclude<PriceStatus, 'missing'>;
};

export type PositionInput = {
  stockId: string;
  symbol: string;
  nameTh: string;
  transactions: readonly PurchaseInput[];
  /** `null` when the market-data cache holds nothing for this stock. */
  price: PriceInput | null;
};

export type Position = {
  stockId: string;
  symbol: string;
  nameTh: string;
  transactionCount: number;
  totalInvested: string;
  totalShares: string;
  averageCost: string | null;
  currentPrice: string | null;
  currentValue: string | null;
  profitLoss: string | null;
  returnPercent: number | null;
  /** Filled in by `computePortfolio`; `null` on a standalone position. */
  allocationPercent: number | null;
  priceStatus: PriceStatus;
  provider: string | null;
  priceCapturedAt: string | null;
};

export type Portfolio = {
  positions: Position[];
  totalInvested: string;
  totalShares: string;
  currentValue: string | null;
  profitLoss: string | null;
  returnPercent: number | null;
  dcaPerMonth: string | null;
  transactionCount: number;
  /**
   * True when at least one position has no usable price. The UI must then
   * label the portfolio value as partial rather than complete.
   */
  hasIncompletePricing: boolean;
};

/** Aggregates every purchase of one stock into a single position. */
export function computePosition(input: PositionInput): Position {
  const { totalInvested, totalShares } = netAmounts(input.transactions);
  const price = input.price?.price ?? null;
  const value = currentValue(totalShares, price);
  const profit = profitLoss(value, totalInvested);

  return {
    stockId: input.stockId,
    symbol: input.symbol,
    nameTh: input.nameTh,
    transactionCount: input.transactions.length,
    totalInvested,
    totalShares,
    averageCost: averageCost(totalInvested, totalShares),
    currentPrice: price,
    currentValue: value,
    profitLoss: profit,
    returnPercent: returnPercent(profit, totalInvested),
    allocationPercent: null,
    priceStatus: input.price?.status ?? 'missing',
    provider: input.price?.provider ?? null,
    priceCapturedAt: input.price?.capturedAt ?? null,
  };
}

/** Ranking value: what a position is worth, or what it cost when unpriced. */
function sortKey(position: Position): string {
  return position.currentValue ?? position.totalInvested;
}

/**
 * Aggregates every position into the portfolio the dashboard renders.
 *
 * Positions without a price still contribute their cost to `totalInvested`, so
 * "how much have I put in" is always answerable; they contribute nothing to
 * `currentValue`, and their absence is reported through `hasIncompletePricing`
 * rather than silently rolled into the total.
 */
export function computePortfolio(inputs: readonly PositionInput[]): Portfolio {
  const positions = inputs.map(computePosition);

  const totals = netAmounts(
    positions.map((position) => ({
      investedAmount: position.totalInvested,
      shares: position.totalShares,
    })),
  );

  const pricedPositions = positions.filter((position) => position.currentValue !== null);
  const hasIncompletePricing = pricedPositions.length < positions.length;

  const portfolioValue =
    pricedPositions.length === 0
      ? null
      : roundMoney(
          pricedPositions.reduce(
            (sum, position) => add(sum, position.currentValue as string),
            parseDecimal('0'),
          ),
        );

  const portfolioProfit = profitLoss(portfolioValue, totals.totalInvested);

  const ranked = [...positions].sort((a, b) =>
    parseDecimal(sortKey(b)).comparedTo(parseDecimal(sortKey(a))),
  );

  const withAllocation = ranked.map((position) => ({
    ...position,
    allocationPercent:
      portfolioValue === null ? null : allocationPercent(position.currentValue, portfolioValue),
  }));

  const allTransactions = inputs.flatMap((input) => input.transactions);

  return {
    positions: withAllocation,
    totalInvested: totals.totalInvested,
    totalShares: roundShares(totals.totalShares),
    currentValue: portfolioValue,
    profitLoss: portfolioProfit,
    returnPercent: returnPercent(portfolioProfit, totals.totalInvested),
    dcaPerMonth: dcaPerMonth(allTransactions),
    transactionCount: allTransactions.length,
    hasIncompletePricing,
  };
}
