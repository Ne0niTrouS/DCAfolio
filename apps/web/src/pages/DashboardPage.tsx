import { useMemo, type CSSProperties } from 'react';

import { Panel } from '@/components/Panel';
import { PieIcon } from '@/components/icons';
import { EmptyState, ErrorState } from '@/components/states';
import { MarketStatusStrip } from '@/features/market-data/MarketStatusStrip';
import { syncStateFrom } from '@/features/market-data/market-status';
import { useLatestPrices } from '@/features/market-data/use-latest-prices';
import { useMarketStatus } from '@/features/market-data/use-market-status';
import { syncErrorKey, useSyncPrices } from '@/features/market-data/use-sync-prices';
import { DashboardSkeleton } from '@/features/portfolio/DashboardSkeleton';
import { InvestedPanel } from '@/features/portfolio/InvestedPanel';
import { PortfolioSummaryCard } from '@/features/portfolio/PortfolioSummaryCard';
import { PositionList } from '@/features/portfolio/PositionList';
import { RecentTransactions } from '@/features/portfolio/RecentTransactions';
import { SummaryCard } from '@/features/portfolio/SummaryCard';
import { investedSeries } from '@/features/portfolio/invested-series';
import { usePortfolio } from '@/features/portfolio/use-portfolio';
import { useT } from '@/i18n/use-language';
import { mapDataError } from '@/lib/errors';

export function DashboardPage() {
  const t = useT();
  const { portfolio, transactions, isLoading, error, refetch, isEmpty } = usePortfolio();
  const pricesQuery = useLatestPrices();
  const marketStatus = useMarketStatus();
  const sync = useSyncPrices();

  const series = useMemo(() => investedSeries(transactions), [transactions]);

  // Derived from the mutation rather than tracked separately, so the panel
  // cannot claim a success the request never had.
  const syncState = syncStateFrom(sync.data, syncErrorKey(sync.error), sync.isPending);

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t('dashboard.welcome')}</p>
      </header>

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading && error ? (
        <ErrorState
          title={t('dashboard.loadError')}
          description={t(mapDataError(error))}
          onRetry={() => void refetch()}
        />
      ) : null}

      {/* No call to action here. Purchases are recorded from History; the
          dashboard reports the portfolio rather than inviting edits to it. */}
      {!isLoading && !error && isEmpty ? (
        <EmptyState title={t('dashboard.emptyTitle')} description={t('dashboard.emptyBody')} />
      ) : null}

      {/* The stagger runs top to bottom so the eye lands on the headline
          figures first. It reveals content that is already rendered — nothing
          here waits on an animation, and reduced-motion skips all of it. */}
      {!isLoading && !error && !isEmpty ? (
        <>
          <div className="enter">
            <PortfolioSummaryCard portfolio={portfolio} />
          </div>

          <div className="enter" style={{ '--enter-delay': '60ms' } as CSSProperties}>
            <MarketStatusStrip
              prices={pricesQuery.data ?? []}
              marketState={marketStatus.data?.state ?? 'unknown'}
              failed={pricesQuery.isError}
              onSync={() => sync.mutate()}
              sync={syncState}
            />
          </div>

          <div
            className="enter grid gap-4 xl:grid-cols-2"
            style={{ '--enter-delay': '120ms' } as CSSProperties}
          >
            <Panel title={t('dashboard.allocation')} icon={<PieIcon />}>
              <PositionList
                positions={portfolio.positions}
                totalInvested={portfolio.totalInvested}
              />
            </Panel>

            <InvestedPanel points={series} />
          </div>

          <div
            className="enter grid gap-4 xl:grid-cols-[2fr_1fr]"
            style={{ '--enter-delay': '180ms' } as CSSProperties}
          >
            <RecentTransactions transactions={transactions} />
            <SummaryCard portfolio={portfolio} />
          </div>
        </>
      ) : null}
    </section>
  );
}
