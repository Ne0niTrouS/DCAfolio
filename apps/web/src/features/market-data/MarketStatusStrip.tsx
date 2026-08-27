import { UNAVAILABLE, type MarketPrice, type MarketState } from '@dcafolio/shared';

import { Button } from '@/components/Button';
import { InfoIcon } from '@/components/icons';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';
import { useRelativeTime } from '@/i18n/use-relative-time';

type MarketStatusStripProps = {
  prices: MarketPrice[];
  marketState?: MarketState;
  /** True when the price query itself failed; cached values may still show. */
  failed?: boolean;
  /** Omitted where a refresh makes no sense, such as an empty portfolio. */
  onSync?: () => void;
  syncing?: boolean;
  /** What the last refresh achieved, already translated. */
  syncNote?: string;
};

const MARKET_STATE_KEY: Record<MarketState, TranslationKey> = {
  open: 'market.open',
  closed: 'market.closed',
  unknown: 'market.unknown',
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
  onSync,
  syncing = false,
  syncNote,
}: MarketStatusStripProps) {
  const t = useT();
  const relative = useRelativeTime();

  const latest = newest(prices);
  const isStale = failed || prices.some((price) => price.status === 'stale');
  const provider = latest?.provider ?? null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 text-xs text-ink-muted shadow-sm">
      <span className="inline-flex items-center gap-2 font-medium text-ink">
        {marketState === 'unknown' ? (
          <InfoIcon className="size-4 text-ink-faint" />
        ) : (
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${
              marketState === 'open' ? 'bg-accent' : 'bg-ink-faint'
            }`}
          />
        )}
        {t(MARKET_STATE_KEY[marketState])}
      </span>

      <span aria-hidden="true">·</span>
      <span>{t('market.provider', { provider: provider ?? UNAVAILABLE })}</span>

      <span aria-hidden="true">·</span>
      <span>{t('market.updated', { time: relative(latest?.capturedAt) })}</span>

      {provider === 'mock' ? (
        <span className="rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 font-medium text-ink">
          {t('market.mockBadge')}
        </span>
      ) : null}

      {isStale ? (
        <span className="rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 font-medium text-ink">
          {t('market.cachedBadge')}
        </span>
      ) : null}

      {onSync ? (
        <div className="ms-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Announced politely: the outcome matters, but not enough to
              interrupt whatever the reader is doing. */}
          {syncNote ? (
            <span role="status" className="text-ink-muted">
              {syncNote}
            </span>
          ) : null}
          <Button variant="secondary" pending={syncing} onClick={onSync} className="px-3">
            {t('market.sync')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
