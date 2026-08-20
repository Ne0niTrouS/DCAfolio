import {
  UNAVAILABLE,
  formatRelativeTime,
  type MarketPrice,
  type MarketState,
} from '@dcafolio/shared';

type MarketStatusStripProps = {
  prices: MarketPrice[];
  marketState?: MarketState;
  /** True when the price query itself failed; cached values may still show. */
  failed?: boolean;
};

const MARKET_STATE_LABEL: Record<MarketState, string> = {
  open: 'Market open',
  closed: 'Market closed',
  unknown: 'Market status unknown',
};

function newest(prices: MarketPrice[]): MarketPrice | null {
  return prices.reduce<MarketPrice | null>((latest, price) => {
    if (!latest) return price;
    return price.capturedAt > latest.capturedAt ? price : latest;
  }, null);
}

/**
 * States plainly where a price came from and how old it is.
 *
 * Cached data is never presented as real-time, and the mock provider is always
 * labelled as such — a number that looks like a quote but is not one would be
 * worse than no number at all.
 */
export function MarketStatusStrip({
  prices,
  marketState = 'unknown',
  failed = false,
}: MarketStatusStripProps) {
  const latest = newest(prices);
  const isStale = failed || prices.some((price) => price.status === 'stale');
  const provider = latest?.provider ?? null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border-subtle bg-surface-raised px-4 py-2.5 text-xs text-ink-muted">
      <span>{MARKET_STATE_LABEL[marketState]}</span>

      <span aria-hidden="true">·</span>
      <span>Provider: {provider ?? UNAVAILABLE}</span>

      <span aria-hidden="true">·</span>
      <span>Updated {formatRelativeTime(latest?.capturedAt)}</span>

      {provider === 'mock' ? (
        <span className="rounded-full border border-border-subtle px-2 py-0.5 font-medium text-ink">
          Mock data — not real prices
        </span>
      ) : null}

      {isStale ? (
        <span className="rounded-full border border-border-subtle px-2 py-0.5 font-medium text-ink">
          Cached — may be out of date
        </span>
      ) : null}
    </div>
  );
}
