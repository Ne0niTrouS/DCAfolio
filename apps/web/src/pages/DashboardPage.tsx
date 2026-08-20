import { todayIsoDate } from '@dcafolio/shared';
import { useMemo, useState } from 'react';

import { Button } from '@/components/Button';
import { Panel } from '@/components/Panel';
import { PieIcon, TrendUpIcon } from '@/components/icons';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { MarketStatusStrip } from '@/features/market-data/MarketStatusStrip';
import { useLatestPrices } from '@/features/market-data/use-latest-prices';
import { useMarketStatus } from '@/features/market-data/use-market-status';
import { InvestedChart } from '@/features/portfolio/InvestedChart';
import { KpiCards } from '@/features/portfolio/KpiCards';
import { PositionList } from '@/features/portfolio/PositionList';
import { RecentTransactions } from '@/features/portfolio/RecentTransactions';
import { SummaryCard } from '@/features/portfolio/SummaryCard';
import { investedSeries } from '@/features/portfolio/invested-series';
import { usePortfolio } from '@/features/portfolio/use-portfolio';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';
import { useStocks } from '@/features/transactions/queries';
import { useT } from '@/i18n/use-language';
import { mapDataError } from '@/lib/errors';

export function DashboardPage() {
  const t = useT();
  const { portfolio, transactions, isLoading, error, refetch, isEmpty } = usePortfolio();
  const pricesQuery = useLatestPrices();
  const marketStatus = useMarketStatus();
  const { data: stocks = [] } = useStocks();
  const [adding, setAdding] = useState(false);

  const series = useMemo(() => investedSeries(transactions), [transactions]);

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {t('dashboard.title')}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t('dashboard.welcome')}</p>
      </header>

      {isLoading ? <LoadingState label={t('dashboard.loadingPortfolio')} /> : null}

      {!isLoading && error ? (
        <ErrorState
          title={t('dashboard.loadError')}
          description={t(mapDataError(error))}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error && isEmpty ? (
        <EmptyState
          title={t('dashboard.emptyTitle')}
          description={t('dashboard.emptyBody')}
          action={<Button onClick={() => setAdding(true)}>{t('common.addPurchase')}</Button>}
        />
      ) : null}

      {!isLoading && !error && !isEmpty ? (
        <>
          <KpiCards portfolio={portfolio} />

          <MarketStatusStrip
            prices={pricesQuery.data ?? []}
            marketState={marketStatus.data?.state ?? 'unknown'}
            failed={pricesQuery.isError}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title={t('dashboard.allocation')} icon={<PieIcon />}>
              <PositionList
                positions={portfolio.positions}
                totalInvested={portfolio.totalInvested}
              />
            </Panel>

            <Panel title={t('dashboard.investedOverTime')} icon={<TrendUpIcon />}>
              {series.length > 0 ? (
                <InvestedChart points={series} label={t('dashboard.investedOverTime')} />
              ) : (
                <p className="py-10 text-center text-sm text-ink-muted">
                  {t('dashboard.noChartData')}
                </p>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <RecentTransactions transactions={transactions} />
            <SummaryCard portfolio={portfolio} />
          </div>
        </>
      ) : null}

      {adding ? (
        <TransactionDialog
          stocks={stocks}
          today={todayIsoDate()}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </section>
  );
}
