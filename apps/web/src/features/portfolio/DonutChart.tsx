import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';

import { donutColor } from './donut-colors';
import {
  DONUT_RADIUS,
  DONUT_SIZE,
  DONUT_STROKE,
  slicePaths,
  type DonutSegment,
} from './donut-geometry';

type DonutChartProps = {
  segments: DonutSegment[];
  /** Which slice the centre is describing. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  centerValue: string;
  centerLabel: string;
  /** Where the centre leads, when the selected slice has somewhere to go. */
  centerTo?: string | undefined;
  centerDescription?: string | undefined;
  summary: string;
};

/**
 * Allocation as a ring, with the selected slice named in the middle.
 *
 * Pressing a slice reports its share rather than leaving the page. Navigation
 * used to happen on that first press, which meant the one thing a reader
 * presses a chart to find out — how big is that slice — was the one thing the
 * press did not tell them. The centre then carries the link, so the holding is
 * still two interactions away and one of them states the number first.
 *
 * Slices are focusable and named, so the figure is reachable without a mouse,
 * and the list beside the ring prints every share as text regardless.
 */
export function DonutChart({
  segments,
  selectedId,
  onSelect,
  centerValue,
  centerLabel,
  centerTo,
  centerDescription,
  summary,
}: DonutChartProps) {
  function handleKey(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // Space scrolls the page otherwise, which moves the chart out from under
    // the reader who just pressed it.
    event.preventDefault();
    onSelect(id);
  }

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
          const selected = segment?.id === selectedId;

          const slice = (
            <path
              d={arc.d}
              fill="none"
              stroke={donutColor(index)}
              strokeWidth={DONUT_STROKE}
              // Dimming the others is a second cue for the same fact the centre
              // states in words; it is never the only one.
              opacity={selectedId === null || selected ? 1 : 0.45}
              className="transition-opacity"
            />
          );

          return (
            <g
              key={arc.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={segment?.description ?? segment?.label ?? ''}
              onClick={() => segment && onSelect(segment.id)}
              onKeyDown={(event) => segment && handleKey(event, segment.id)}
              className="cursor-pointer outline-none focus-visible:opacity-70"
            >
              {slice}
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {centerTo ? (
          <Link
            to={centerTo}
            aria-label={centerDescription ?? centerLabel}
            className="pointer-events-auto flex flex-col items-center rounded-xl px-3 py-1 transition-colors hover:bg-surface-sunken"
          >
            <span className="tnum text-2xl font-semibold tracking-tight text-ink">
              {centerValue}
            </span>
            <span className="text-xs text-ink-muted">{centerLabel}</span>
          </Link>
        ) : (
          <>
            <span className="tnum text-2xl font-semibold tracking-tight text-ink">
              {centerValue}
            </span>
            <span className="text-xs text-ink-muted">{centerLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
