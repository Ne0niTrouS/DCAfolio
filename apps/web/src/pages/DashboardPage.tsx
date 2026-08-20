import { todayIsoDate } from '@dcafolio/shared';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { MarketStatusStrip } from '@/features/market-data/MarketStatusStrip';
import { useLatestPrices } from '@/features/market-data/use-latest-prices';
import { useMarketStatus } from '@/features/market-data/use-market-status';
import { KpiCards } from '@/features/portfolio/KpiCards';
import { PositionList } from '@/features/portfolio/PositionList';
import { RecentTransactions } from '@/features/portfolio/RecentTransactions';
import { usePortfolio } from '@/features/portfolio/use-portfolio';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';
import { useStocks } from '@/features/transactions/queries';
import { mapDataError } from '@/lib/errors';

export function DashboardPage() {
  const { portfolio, transactions, isLoading, error, refetch, isEmpty } = usePortfolio();
  const pricesQuery = useLatestPrices();
  const marketStatus = useMarketStatus();
  const { data: stocks = [] } = useStocks();
  const [adding, setAdding] = useState(false);

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>

      {isLoading ? <LoadingState label="Loading your portfolio…" /> : null}

      {!isLoading && error ? (
        <ErrorState
          title="Could not load your portfolio."
          description={mapDataError(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error && isEmpty ? (
        <EmptyState
          title="No investments yet."
          description="Add your first stock purchase."
          action={<Button onClick={() => setAdding(true)}>Add Purchase</Button>}
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

          <section aria-labelledby="positions-heading">
            <h2 id="positions-heading" className="text-sm font-semibold text-ink">
              Portfolio allocation
            </h2>
            <div className="mt-2">
              <PositionList positions={portfolio.positions} />
            </div>
          </section>

          <RecentTransactions transactions={transactions} />
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
