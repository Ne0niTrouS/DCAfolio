import { donutColor } from './donut-colors';

export type DonutSegment = {
  id: string;
  label: string;
  percent: number;
};

const SIZE = 168;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Arc length and start offset for each slice, in stroke units. */
function arcs(segments: DonutSegment[]): { id: string; length: number; offset: number }[] {
  let offset = 0;
  return segments.map((segment) => {
    const length = (Math.max(segment.percent, 0) / 100) * CIRCUMFERENCE;
    const arc = { id: segment.id, length, offset };
    offset += length;
    return arc;
  });
}

/**
 * Allocation as a ring, with the largest slice named in the middle.
 *
 * Purely presentational: the percentages arrive already computed, and the same
 * figures are listed as text next to it. `role="img"` with a summary label
 * keeps it meaningful without a screen reader walking the arcs.
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
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={summary}
        className="size-full -rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth={STROKE}
        />
        {arcs(segments).map((arc, index) => (
          <circle
            key={arc.id}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={donutColor(index)}
            strokeWidth={STROKE}
            strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
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
