import { formatDate, formatMoney } from '@dcafolio/shared';
import { useId } from 'react';

import type { InvestedPoint } from './invested-series';

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 12, right: 8, bottom: 26, left: 52 };
const PLOT = {
  width: WIDTH - PADDING.left - PADDING.right,
  height: HEIGHT - PADDING.top - PADDING.bottom,
};
const GRID_LINES = 4;

/** Nearest round number at or above `value`, so the axis reads cleanly. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K`;
  return `฿${value}`;
}

/**
 * Cumulative invested amount over time, as a filled line.
 *
 * Requires at least two points; `InvestedPanel` is what enforces that. One
 * purchase is not a trend: this used to stretch a flat segment across the full
 * width with the same date at both ends, which looked like a chart and said
 * nothing. Ratios here are layout, not money, so plain `number` arithmetic is
 * fine; every figure the user reads is formatted from the decimal string.
 */
export function InvestedChart({ points, label }: { points: InvestedPoint[]; label: string }) {
  const gradientId = useId();

  const values = points.map((point) => Number(point.total));
  const max = niceCeiling(Math.max(...values, 0));

  const x = (index: number) => PADDING.left + (index / (points.length - 1)) * PLOT.width;
  const y = (value: number) => PADDING.top + PLOT.height - (value / max) * PLOT.height;

  const line = points.map((point, index) => `${x(index)},${y(Number(point.total))}`).join(' ');
  const area = `${line} ${x(points.length - 1)},${PADDING.top + PLOT.height} ${x(0)},${PADDING.top + PLOT.height}`;

  const last = points[points.length - 1];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label}: ${formatMoney(last?.total)} ${formatDate(last?.date)}`}
        className="h-56 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: GRID_LINES + 1 }, (_, step) => {
          const value = (max / GRID_LINES) * step;
          const lineY = y(value);
          return (
            <g key={step}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={lineY}
                y2={lineY}
                stroke="var(--color-border-subtle)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <text
                x={PADDING.left - 8}
                y={lineY + 4}
                textAnchor="end"
                className="fill-ink-faint text-[11px]"
              >
                {compactMoney(value)}
              </text>
            </g>
          );
        })}

        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={x(points.length - 1)}
          cy={y(Number(last?.total ?? 0))}
          r="4.5"
          fill="var(--color-accent)"
          stroke="var(--color-surface-raised)"
          strokeWidth="2"
        />
      </svg>

      <figcaption className="mt-1 flex justify-between text-[11px] text-ink-faint">
        <span className="tnum">{formatDate(points[0]?.date)}</span>
        <span className="tnum">{formatDate(last?.date)}</span>
      </figcaption>
    </figure>
  );
}
