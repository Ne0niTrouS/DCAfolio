import { pricePerShare } from '@dcafolio/calculation';
import { UNAVAILABLE, formatDate, formatMoney, formatShares } from '@dcafolio/shared';
import { Link, useParams } from 'react-router-dom';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { EmptyState, ErrorState } from '@/components/states';
import { StockDetailSkeleton } from '@/features/portfolio/StockDetailSkeleton';
import { usePortfolio } from '@/features/portfolio/use-portfolio';
import { useT } from '@/i18n/use-language';
import { useRelativeTime } from '@/i18n/use-relative-time';
import { mapDataError } from '@/lib/errors';

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3.5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight">{children}</p>
    </div>
  );
}

export function StockDetailPage() {
  const { symbol = '' } = useParams<{ symbol: string }>();
  const t = useT();
  const relative = useRelativeTime();
  const { portfolio, transactions, isLoading, error, refetch } = usePortfolio();

  if (isLoading) return <StockDetailSkeleton symbol={symbol} />;

  if (error) {
    return (
      <ErrorState
        title={t('stock.loadError')}
        description={t(mapDataError(error))}
        onRetry={() => void refetch()}
      />
    );
  }

  const position = portfolio.positions.find((candidate) => candidate.symbol === symbol);

  if (!position) {
    return (
      <EmptyState
        title={t('stock.emptyTitle', { symbol })}
        description={t('stock.emptyBody')}
        action={
          <Link to="/" className="text-sm font-medium text-accent-strong hover:underline">
            {t('common.backToDashboard')}
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
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{position.symbol}</h1>
        <p className="mt-1 text-sm text-ink-muted">{position.nameTh}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label={t('stock.shares')}>
          <span className="tnum text-ink">{formatShares(position.totalShares)}</span>
        </Figure>
        <Figure label={t('stock.totalInvested')}>
          <span className="tnum text-ink">{formatMoney(position.totalInvested)}</span>
        </Figure>
        <Figure label={t('stock.averageCost')}>
          <span className="tnum text-ink">{formatMoney(position.averageCost)}</span>
        </Figure>
        <Figure label={t('stock.currentPrice')}>
          <span className="tnum text-ink">{formatMoney(position.currentPrice)}</span>
        </Figure>
        <Figure label={t('stock.currentValue')}>
          <span className="tnum text-ink">{formatMoney(position.currentValue)}</span>
        </Figure>
        <Figure label={t('stock.profitLoss')}>
          <SignedMoney value={position.profitLoss} />
        </Figure>
        <Figure label={t('stock.return')}>
          <SignedPercent value={position.returnPercent} />
        </Figure>
        <Figure label={t('stock.allocation')}>
          <span className="tnum text-ink">
            {position.allocationPercent === null
              ? UNAVAILABLE
              : `${position.allocationPercent.toFixed(2)}%`}
          </span>
        </Figure>
      </div>

      <p className="text-xs text-ink-faint">
        {position.priceStatus === 'missing'
          ? t('stock.noPriceCaptured')
          : t(position.priceStatus === 'stale' ? 'stock.priceFromCached' : 'stock.priceFrom', {
              provider: position.provider ?? UNAVAILABLE,
              time: relative(position.priceCapturedAt),
            })}
      </p>

      <section aria-labelledby="purchase-history-heading">
        <h2
          id="purchase-history-heading"
          className="text-sm font-semibold tracking-tight text-ink"
        >
          {t('stock.purchaseHistory')}
        </h2>

        <ul className="mt-3 flex flex-col gap-2">
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 text-sm shadow-sm"
            >
              <span className="tnum text-ink-muted">{formatDate(purchase.purchaseDate)}</span>
              <span className="tnum text-ink">{formatMoney(purchase.investedAmount)}</span>
              <span className="tnum text-ink-muted">
                {formatShares(purchase.shares)} {t('common.sharesUnit')}
              </span>
              <span className="tnum text-ink-muted">
                {t('purchase.perShare', {
                  value: formatMoney(pricePerShare(purchase.investedAmount, purchase.shares)),
                })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
