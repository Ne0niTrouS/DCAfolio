import type { Position } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney, formatPercent, formatShares } from '@dcafolio/shared';
import { Link } from 'react-router-dom';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { PieIcon } from '@/components/icons';
import { useT } from '@/i18n/use-language';

import { DonutChart } from './DonutChart';
import { donutColor } from './donut-colors';

/**
 * Allocation: a ring, then one row per holding, then the total.
 *
 * Every figure the ring encodes is also printed as text beside it — the chart
 * is a summary, never the only way to read the number.
 */
export function PositionList({
  positions,
  totalInvested,
}: {
  positions: Position[];
  totalInvested: string;
}) {
  const t = useT();

  const segments = positions.map((position) => ({
    id: position.stockId,
    label: position.symbol,
    percent: position.allocationPercent ?? 0,
  }));

  const largest = positions[0];
  const summary = positions
    .map(
      (position) =>
        `${position.symbol} ${position.allocationPercent === null ? UNAVAILABLE : formatPercent(position.allocationPercent)}`,
    )
    .join(', ');

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <DonutChart
        segments={segments}
        centerValue={
          largest?.allocationPercent === null || largest === undefined
            ? UNAVAILABLE
            : formatPercent(largest.allocationPercent, 0)
        }
        centerLabel={largest?.symbol ?? ''}
        summary={summary}
      />

      <div className="min-w-0 flex-1">
        <ul className="flex flex-col gap-1">
          {positions.map((position, index) => (
            <li key={position.stockId}>
              <Link
                to={`/stocks/${position.symbol}`}
                className="block rounded-xl px-2 py-2 transition-colors hover:bg-surface-sunken"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: donutColor(index) }}
                    />
                    <span className="truncate font-semibold text-ink">{position.symbol}</span>
                  </span>
                  <span className="tnum shrink-0 font-semibold text-ink">
                    {formatMoney(position.totalInvested)}
                  </span>
                </div>

                <div className="mt-0.5 flex items-baseline justify-between gap-3 pl-4.5 text-sm">
                  <span className="text-ink-muted">
                    {formatShares(position.totalShares)} {t('common.sharesUnit')}
                  </span>
                  <span className="tnum text-ink-muted">
                    {position.allocationPercent === null
                      ? UNAVAILABLE
                      : formatPercent(position.allocationPercent)}
                  </span>
                </div>

                <div className="mt-0.5 flex items-baseline justify-between gap-3 pl-4.5 text-sm">
                  <span className="text-xs text-ink-faint">
                    {position.priceStatus === 'missing'
                      ? t('market.noPriceYet')
                      : position.priceStatus === 'stale'
                        ? t('market.cachedPrice')
                        : ''}
                  </span>
                  <span className="flex shrink-0 gap-3">
                    <SignedMoney value={position.profitLoss} />
                    <SignedPercent value={position.returnPercent} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent-subtle px-3 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent-strong">
            <PieIcon className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-accent-strong">
                {t('dashboard.totalHoldings')}
              </span>
              <span className="tnum font-semibold text-accent-strong">
                {formatMoney(totalInvested)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm text-ink-muted">
              <span>{t('dashboard.stockCount', { count: positions.length })}</span>
              <span className="tnum">{formatPercent(positions.length > 0 ? 100 : 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
