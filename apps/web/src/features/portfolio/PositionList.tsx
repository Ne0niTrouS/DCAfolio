import type { Position } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney, formatPercent, formatShares } from '@dcafolio/shared';
import { useState } from 'react';
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
 *
 * The list is capped so a long portfolio does not push the rest of the
 * dashboard off the screen; "view all" reveals the remainder in place rather
 * than sending the reader to another page for figures already loaded here.
 */

/** How many holdings the list shows before "view all" is offered. */
const VISIBLE_POSITIONS = 5;

export function PositionList({
  positions,
  totalInvested,
}: {
  positions: Position[];
  totalInvested: string;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const share = (position: Position) =>
    position.allocationPercent === null
      ? UNAVAILABLE
      : formatPercent(position.allocationPercent);

  const segments = positions.map((position) => ({
    id: position.stockId,
    label: position.symbol,
    percent: position.allocationPercent ?? 0,
    description: `${position.symbol} ${share(position)}`,
  }));

  // The ring always shows every holding; only the list below it is capped. A
  // slice pressed from outside the cap is added back, so pressing it never
  // leaves the exact figure with nowhere to appear.
  const capped = positions.slice(0, VISIBLE_POSITIONS);
  const pressed = positions.find(
    (position) => position.stockId === selectedId && !capped.includes(position),
  );
  const visible = expanded ? positions : pressed ? [...capped, pressed] : capped;

  // Nothing pressed yet shows the biggest holding, which is the answer to the
  // question somebody looking at an allocation ring most often has.
  const selected =
    positions.find((position) => position.stockId === selectedId) ?? positions[0];

  const summary = positions
    .map((position) => `${position.symbol} ${share(position)}`)
    .join(', ');

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <DonutChart
        segments={segments}
        selectedId={selectedId}
        onSelect={setSelectedId}
        // The exact share, not a rounded one: reading it off the ring is the
        // reason for pressing a slice, and "15%" for 15.13% would send anyone
        // who needs the real figure hunting for it in the list anyway.
        centerValue={selected === undefined ? UNAVAILABLE : share(selected)}
        centerLabel={selected?.symbol ?? ''}
        {...(selected
          ? {
              centerTo: `/stocks/${selected.symbol}`,
              centerDescription: `${selected.symbol} ${share(selected)}`,
            }
          : {})}
        summary={summary}
      />

      <div className="min-w-0 flex-1">
        <ul className="flex flex-col gap-1">
          {visible.map((position) => (
            <li key={position.stockId}>
              <Link
                to={`/stocks/${position.symbol}`}
                onFocus={() => setSelectedId(position.stockId)}
                aria-current={position.stockId === selectedId ? 'true' : undefined}
                className={`block rounded-xl px-2 py-2 transition-colors hover:bg-surface-sunken ${
                  position.stockId === selectedId
                    ? 'bg-surface-sunken ring-1 ring-border-subtle'
                    : ''
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      // Keyed to the ring, not to this row: a slice pressed from
                      // outside the cap is appended here out of order.
                      style={{ backgroundColor: donutColor(positions.indexOf(position)) }}
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

        {positions.length > VISIBLE_POSITIONS ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-surface-sunken"
          >
            {expanded
              ? t('dashboard.showFewer')
              : t('dashboard.viewAllHoldings', { count: positions.length })}
          </button>
        ) : null}

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
