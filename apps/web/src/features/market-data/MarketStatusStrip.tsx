import { formatDateTime, type MarketPrice, type MarketState } from '@dcafolio/shared';

import { Button } from '@/components/Button';
import { InfoIcon } from '@/components/icons';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';
import { useRelativeTime } from '@/i18n/use-relative-time';

import {
  freshnessOf,
  newestPrice,
  providerLabel,
  toneOf,
  type SyncState,
  type Tone,
} from './market-status';

type MarketStatusStripProps = {
  prices: MarketPrice[];
  marketState?: MarketState;
  /** True when the price query itself failed; cached values may still show. */
  failed?: boolean;
  /** Omitted where a refresh makes no sense, such as an empty portfolio. */
  onSync?: () => void;
  sync?: SyncState;
};

const MARKET_STATE_KEY: Record<MarketState, TranslationKey> = {
  open: 'market.open',
  closed: 'market.closed',
  unknown: 'market.unknown',
};

/** A glyph per tone, so the meaning survives with every colour removed. */
const TONE_MARK: Record<Tone, string> = {
  ok: '✓',
  warn: '⚠',
  error: '✕',
  busy: '↻',
};

const TONE_CLASS: Record<Tone, string> = {
  ok: 'text-profit',
  warn: 'text-ink',
  error: 'text-loss',
  busy: 'text-ink-muted',
};

function StatusLine({
  tone,
  headline,
  detail,
}: {
  tone: Tone;
  headline: string;
  detail?: string | undefined;
}) {
  return (
    <p className="flex items-baseline gap-2 text-sm">
      <span aria-hidden="true" className={`font-semibold ${TONE_CLASS[tone]}`}>
        {TONE_MARK[tone]}
      </span>
      <span className="min-w-0">
        <span className="font-medium text-ink">{headline}</span>
        {detail ? <span className="text-ink-muted"> · {detail}</span> : null}
      </span>
    </p>
  );
}

/**
 * States plainly where a price came from and how old it is.
 *
 * Two separate facts share this panel and are deliberately not merged: how
 * current the stored prices are, and what the last refresh did. A refresh that
 * fetched nothing leaves the prices exactly as stale as they were, and one
 * line saying "updated" would cover both.
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
  sync = { kind: 'idle' },
}: MarketStatusStripProps) {
  const t = useT();
  const relative = useRelativeTime();

  const freshness = freshnessOf(prices, failed);
  const latest = newestPrice(prices);
  const source = providerLabel(latest?.provider ?? null);
  const syncing = sync.kind === 'loading';

  return (
    <section
      aria-label={t('market.heading')}
      className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {t('market.heading')}
        </h2>

        <div className="mt-1.5 flex flex-col gap-1">
          {freshness.kind === 'none' ? (
            <StatusLine tone="warn" headline={t('market.noPricesYet')} />
          ) : freshness.kind === 'unavailable' ? (
            <StatusLine tone="error" headline={t('market.pricesUnavailable')} />
          ) : freshness.kind === 'fresh' ? (
            <StatusLine
              tone="ok"
              headline={t('market.updatedAgo', { time: relative(freshness.capturedAt) })}
            />
          ) : (
            <StatusLine
              tone="warn"
              headline={t('market.mayBeOutdated')}
              detail={t('market.lastUpdatedAt', { at: formatDateTime(freshness.capturedAt) })}
            />
          )}

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            {source ? <span>{t('market.source', { source })}</span> : null}

            <span className="inline-flex items-center gap-1.5">
              {marketState === 'unknown' ? (
                <InfoIcon className="size-3.5 text-ink-faint" />
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

            {latest?.provider === 'mock' ? (
              <span className="rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 font-medium text-ink">
                {t('market.mockBadge')}
              </span>
            ) : null}

            {freshness.kind === 'stale' ? (
              <span className="rounded-full border border-border-subtle bg-surface-sunken px-2 py-0.5 font-medium text-ink">
                {t('market.cachedBadge')}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {onSync ? (
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Button
            variant="secondary"
            pending={syncing}
            onClick={onSync}
            className="px-3"
            aria-label={t('market.sync')}
          >
            {t('market.sync')}
          </Button>

          {/* Announced politely: the outcome matters, but not enough to
              interrupt whatever the reader is doing. */}
          <p role="status" className="text-xs sm:text-right">
            <SyncNote state={sync} />
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** The result of the last refresh, stated in the terms the server reported. */
function SyncNote({ state }: { state: SyncState }) {
  const t = useT();

  if (state.kind === 'idle') return null;

  const tone = toneOf(state);

  if (state.kind === 'loading') {
    return <StatusLine tone={tone} headline={t('market.syncing')} />;
  }

  if (state.kind === 'error') {
    return <StatusLine tone={tone} headline={t('market.syncFailedTitle')} detail={t(state.key)} />;
  }

  if (state.kind === 'skipped') {
    return (
      <StatusLine
        tone={tone}
        headline={t('market.syncSkipped', { minutes: state.retryInMinutes })}
      />
    );
  }

  const counts = t('market.syncCount', { captured: state.captured, total: state.total });

  return (
    <StatusLine
      tone={tone}
      headline={t(state.kind === 'partial' ? 'market.syncPartialTitle' : 'market.syncDoneTitle')}
      detail={counts}
    />
  );
}
