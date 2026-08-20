import { pricePerShare } from '@dcafolio/calculation';
import {
  UNAVAILABLE,
  formatDate,
  formatMoney,
  formatRelativeTime,
  formatShares,
} from '@dcafolio/shared';
import { Link, useParams } from 'react-router-dom';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { usePortfolio } from '@/features/portfolio/use-portfolio';
import { mapDataError } from '@/lib/errors';

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold">{children}</p>
    </div>
  );
}

export function StockDetailPage() {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const { portfolio, transactions, isLoading, error, refetch } = usePortfolio();

  if (isLoading) return <LoadingState label={`Loading ${symbol}…`} />;

  if (error) {
    return (
      <ErrorState
        title="Could not load this stock."
        description={mapDataError(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const position = portfolio.positions.find((candidate) => candidate.symbol === symbol);

  if (!position) {
    return (
      <EmptyState
        title={`No purchases recorded for ${symbol}.`}
        description="Once you record a purchase of this stock it will appear here."
        action={
          <Link to="/" className="text-sm text-accent hover:underline">
            Back to the dashboard
          </Link>
        }
      />
    );
  }

  const purchases = transactions.filter(
    (transaction) => transaction.stockId === position.stockId,
  );

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{position.symbol}</h1>
        <p className="mt-1 text-sm text-ink-muted">{position.nameTh}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Shares">
          <span className="tnum text-ink">{formatShares(position.totalShares)}</span>
        </Figure>
        <Figure label="Total Invested">
          <span className="tnum text-ink">{formatMoney(position.totalInvested)}</span>
        </Figure>
        <Figure label="Average Cost">
          <span className="tnum text-ink">{formatMoney(position.averageCost)}</span>
        </Figure>
        <Figure label="Current Price">
          <span className="tnum text-ink">{formatMoney(position.currentPrice)}</span>
        </Figure>
        <Figure label="Current Value">
          <span className="tnum text-ink">{formatMoney(position.currentValue)}</span>
        </Figure>
        <Figure label="Profit/Loss">
          <SignedMoney value={position.profitLoss} />
        </Figure>
        <Figure label="Return">
          <SignedPercent value={position.returnPercent} />
        </Figure>
        <Figure label="Allocation">
          <span className="tnum text-ink">
            {position.allocationPercent === null
              ? UNAVAILABLE
              : `${position.allocationPercent.toFixed(2)}%`}
          </span>
        </Figure>
      </div>

      <p className="text-xs text-ink-muted">
        {position.priceStatus === 'missing'
          ? 'No market price has been captured for this stock yet.'
          : `Price from ${position.provider ?? UNAVAILABLE}, updated ${formatRelativeTime(
              position.priceCapturedAt,
            )}${position.priceStatus === 'stale' ? ' — cached, may be out of date' : ''}`}
      </p>

      <section aria-labelledby="purchase-history-heading">
        <h2 id="purchase-history-heading" className="text-sm font-semibold text-ink">
          Purchase history
        </h2>

        <ul className="mt-2 flex flex-col gap-2">
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-border-subtle bg-surface-raised px-4 py-2.5 text-sm"
            >
              <span className="tnum text-ink-muted">{formatDate(purchase.purchaseDate)}</span>
              <span className="tnum text-ink">{formatMoney(purchase.investedAmount)}</span>
              <span className="tnum text-ink-muted">
                {formatShares(purchase.shares)} shares
              </span>
              <span className="tnum text-ink-muted">
                {formatMoney(pricePerShare(purchase.investedAmount, purchase.shares))}/share
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
