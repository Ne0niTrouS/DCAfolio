import type { Position } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney, formatPercent, formatShares } from '@dcafolio/shared';
import { Link } from 'react-router-dom';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';

function AllocationBar({ percent }: { percent: number | null }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div className="h-full bg-accent" style={{ width: `${percent ?? 0}%` }} />
    </div>
  );
}

/** Positions, largest first. Each row links to its stock detail page. */
export function PositionList({ positions }: { positions: Position[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {positions.map((position) => (
        <li key={position.stockId}>
          <Link
            to={`/stocks/${position.symbol}`}
            className="block rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 transition-colors hover:bg-surface-sunken"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-ink">{position.symbol}</span>
              <span className="tnum text-sm text-ink-muted">
                {position.allocationPercent === null
                  ? UNAVAILABLE
                  : formatPercent(position.allocationPercent)}
              </span>
            </div>

            <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-muted">
                {formatShares(position.totalShares)} shares ·{' '}
                {formatMoney(position.totalInvested)}
              </span>
              <span className="flex gap-3">
                <SignedMoney value={position.profitLoss} />
                <SignedPercent value={position.returnPercent} />
              </span>
            </div>

            {position.priceStatus !== 'fresh' ? (
              <p className="mt-1 text-xs text-ink-muted">
                {position.priceStatus === 'missing'
                  ? 'No market price yet'
                  : 'Cached price — may be out of date'}
              </p>
            ) : null}

            <AllocationBar percent={position.allocationPercent} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
