import type { Portfolio } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney } from '@dcafolio/shared';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { useT } from '@/i18n/use-language';

import { barPercent } from './cost-vs-value';

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tracking-tight">{children}</dd>
    </div>
  );
}

/**
 * What went in, what it is worth now, and the gap between them.
 *
 * The KPI row states the same four numbers apart from one another; this puts
 * them side by side, which is the comparison the numbers exist to support. Every
 * figure comes from `computePortfolio` — nothing is recalculated here.
 */
export function CostVsValueCard({ portfolio }: { portfolio: Portfolio }) {
  const t = useT();

  const width = barPercent(portfolio.totalInvested, portfolio.currentValue);
  const gained = portfolio.profitLoss !== null && Number(portfolio.profitLoss) >= 0;

  return (
    <section
      aria-label={t('dashboard.costVsValue')}
      className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm"
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {t('dashboard.costVsValue')}
      </h2>

      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label={t('dashboard.totalCost')}>
          <span className="tnum text-ink">{formatMoney(portfolio.totalInvested)}</span>
        </Figure>

        <Figure label={t('dashboard.currentValue')}>
          <span className="tnum text-ink">
            {portfolio.currentValue === null
              ? UNAVAILABLE
              : formatMoney(portfolio.currentValue)}
          </span>
        </Figure>

        <Figure label={t('dashboard.profitLoss')}>
          <SignedMoney value={portfolio.profitLoss} />
        </Figure>

        <Figure label={t('dashboard.returnPercent')}>
          <SignedPercent value={portfolio.returnPercent} />
        </Figure>
      </dl>

      {width === null ? null : (
        <div className="mt-4">
          {/* Decorative: the same comparison is printed in full above. */}
          <div
            aria-hidden="true"
            className="h-2 overflow-hidden rounded-full bg-surface-sunken"
            title={t('dashboard.costVsValue')}
          >
            <div
              className={`h-full rounded-full ${gained ? 'bg-accent' : 'bg-loss'}`}
              style={{ width: `${width}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            {t('dashboard.valueVsCostHint', { percent: width.toFixed(0) })}
          </p>
        </div>
      )}
    </section>
  );
}
