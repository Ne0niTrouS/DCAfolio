import { Link } from 'react-router-dom';

import { donutColor } from './donut-colors';
import {
  DONUT_RADIUS,
  DONUT_SIZE,
  DONUT_STROKE,
  slicePaths,
  type DonutSegment,
} from './donut-geometry';

/**
 * Allocation as a ring, with the largest slice named in the middle.
 *
 * Slices are links when they have somewhere to go, and each carries its own
 * spoken name — a ring that can be clicked but not tabbed to would put the
 * holding behind a mouse. The same figures are listed as text beside it, so the
 * list remains a complete route to everything the ring encodes.
 */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  summary,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  summary: string;
}) {
  return (
    <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
      <svg viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} aria-label={summary} className="size-full">
        <circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={DONUT_RADIUS}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth={DONUT_STROKE}
        />
        {slicePaths(segments).map((arc, index) => {
          const segment = segments[index];

          const slice = (
            <path
              d={arc.d}
              fill="none"
              stroke={donutColor(index)}
              strokeWidth={DONUT_STROKE}
              className={segment?.to ? 'transition-opacity hover:opacity-80' : undefined}
            />
          );

          return segment?.to ? (
            <Link
              key={arc.id}
              to={segment.to}
              aria-label={segment.description ?? segment.label}
              className="cursor-pointer outline-none focus-visible:opacity-80"
            >
              {slice}
            </Link>
          ) : (
            <g key={arc.id}>{slice}</g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-2xl font-semibold tracking-tight text-ink">
          {centerValue}
        </span>
        <span className="text-xs text-ink-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
