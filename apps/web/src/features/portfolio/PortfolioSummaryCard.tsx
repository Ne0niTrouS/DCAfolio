import type { Portfolio } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney } from '@dcafolio/shared';
import type { ReactNode } from 'react';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { PieIcon, TrendUpIcon, WalletIcon } from '@/components/icons';
import { useT } from '@/i18n/use-language';

import { barPercent } from './cost-vs-value';

function Figure({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent-strong">
          {icon}
        </span>
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </dt>
      </div>
      <dd className="mt-2 text-2xl font-semibold tracking-tight">{children}</dd>
    </div>
  );
}

/**
 * What went in, what it is worth now, and the gap between them — in one card.
 *
 * These were two: a row of KPI tiles and a separate cost-versus-value panel.
 * They printed the same four numbers twice under two sets of names, which made
 * the screen look like it held eight facts instead of four. Merged, the
 * comparison the numbers exist to support sits directly under them.
 *
 * Every figure comes from `computePortfolio`; nothing is recalculated here.
 */
export function PortfolioSummaryCard({ portfolio }: { portfolio: Portfolio }) {
  const t = useT();

  const width = barPercent(portfolio.totalInvested, portfolio.currentValue);
  const gained = portfolio.profitLoss !== null && Number(portfolio.profitLoss) >= 0;

  return (
    <section
      aria-label={t('dashboard.costVsValue')}
      className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm sm:p-5"
    >
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Figure label={t('dashboard.portfolioValue')} icon={<TrendUpIcon />}>
          <span className="tnum text-ink">
            {portfolio.currentValue === null
              ? UNAVAILABLE
              : formatMoney(portfolio.currentValue)}
          </span>
        </Figure>

        <Figure label={t('dashboard.totalInvested')} icon={<WalletIcon />}>
          <span className="tnum text-ink">{formatMoney(portfolio.totalInvested)}</span>
        </Figure>

        <Figure label={t('dashboard.profitLoss')} icon={<TrendUpIcon />}>
          <SignedMoney value={portfolio.profitLoss} />
        </Figure>

        <Figure label={t('dashboard.returnPercent')} icon={<PieIcon />}>
          <SignedPercent value={portfolio.returnPercent} />
        </Figure>
      </dl>

      {width === null ? null : (
        <div className="mt-5 border-t border-border-subtle pt-4">
          {/* Decorative: the same comparison is printed in full above. */}
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-sunken">
            {/* Filled from the left rather than appearing at full length, so the
                proportion is read as a proportion. Purely decorative: the two
                amounts it compares are printed above. */}
            <div
              className={`grow-bar h-full origin-left rounded-full ${gained ? 'bg-accent' : 'bg-loss'}`}
              style={{ width: `${width}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {t('dashboard.valueVsCostHint', { percent: width.toFixed(0) })}
          </p>
        </div>
      )}

      {portfolio.hasIncompletePricing ? (
        <p className="mt-2 text-xs text-ink-faint">{t('dashboard.partialPricing')}</p>
      ) : null}
    </section>
  );
}
