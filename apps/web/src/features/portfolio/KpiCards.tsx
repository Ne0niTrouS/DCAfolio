import type { Portfolio } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney } from '@dcafolio/shared';
import type { ReactNode } from 'react';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { PieIcon, TrendUpIcon, WalletIcon } from '@/components/icons';
import { useT } from '@/i18n/use-language';

function Card({
  label,
  icon,
  children,
  note,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent-strong">
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {label}
        </p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{children}</p>
      {note ? <p className="mt-2 text-xs text-ink-faint">{note}</p> : null}
    </div>
  );
}

/**
 * The four numbers that answer: what did I put in, what is it worth, am I up?
 *
 * Deliberately four. A DCA-per-month card used to sit here, and it described
 * the habit rather than the holding — an average of past contributions, next to
 * figures that are all current state. `computePortfolio` still returns
 * `dcaPerMonth` for wherever a dedicated DCA view is built.
 */
export function KpiCards({ portfolio }: { portfolio: Portfolio }) {
  const t = useT();
  const partial = portfolio.hasIncompletePricing;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label={t('dashboard.portfolioValue')}
        icon={<TrendUpIcon />}
        {...(partial ? { note: t('dashboard.partialPricing') } : {})}
      >
        <span className="tnum text-ink">
          {portfolio.currentValue === null ? UNAVAILABLE : formatMoney(portfolio.currentValue)}
        </span>
      </Card>

      <Card label={t('dashboard.totalInvested')} icon={<WalletIcon />}>
        <span className="tnum text-ink">{formatMoney(portfolio.totalInvested)}</span>
      </Card>

      <Card label={t('dashboard.profitLoss')} icon={<TrendUpIcon />}>
        <SignedMoney value={portfolio.profitLoss} />
      </Card>

      <Card label={t('dashboard.returnPercent')} icon={<PieIcon />}>
        <SignedPercent value={portfolio.returnPercent} />
      </Card>
    </div>
  );
}
