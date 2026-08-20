import type { Position } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney, formatPercent, formatShares } from '@dcafolio/shared';
import { Link } from 'react-router-dom';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';
import { useT } from '@/i18n/use-language';

function AllocationBar({ percent }: { percent: number | null }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div className="h-full rounded-full bg-accent" style={{ width: `${percent ?? 0}%` }} />
    </div>
  );
}

/** Positions, largest first. Each row links to its stock detail page. */
export function PositionList({ positions }: { positions: Position[] }) {
  const t = useT();

  return (
    <ul className="flex flex-col gap-2">
      {positions.map((position) => (
        <li key={position.stockId}>
          <Link
            to={`/stocks/${position.symbol}`}
            className="block rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3.5 shadow-sm transition-colors hover:border-accent/40 hover:bg-accent-subtle"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold tracking-tight text-ink">{position.symbol}</span>
              <span className="tnum text-sm font-medium text-ink-muted">
                {position.allocationPercent === null
                  ? UNAVAILABLE
                  : formatPercent(position.allocationPercent)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
              <span className="text-ink-muted">
                {formatShares(position.totalShares)} {t('common.sharesUnit')} ·{' '}
                {formatMoney(position.totalInvested)}
              </span>
              <span className="flex gap-3">
                <SignedMoney value={position.profitLoss} />
                <SignedPercent value={position.returnPercent} />
              </span>
            </div>

            {position.priceStatus !== 'fresh' ? (
              <p className="mt-1 text-xs text-ink-faint">
                {position.priceStatus === 'missing'
                  ? t('market.noPriceYet')
                  : t('market.cachedPrice')}
              </p>
            ) : null}

            <AllocationBar percent={position.allocationPercent} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
