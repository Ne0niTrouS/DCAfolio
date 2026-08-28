export type DonutSegment = {
  id: string;
  label: string;
  percent: number;
  /** Where this slice leads. Omitted for a slice with nowhere to go. */
  to?: string;
  /** Spoken name for the link, e.g. "CPALL 35.00%". */
  description?: string;
};

export const DONUT_SIZE = 168;
export const DONUT_STROKE = 24;
export const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const CENTRE = DONUT_SIZE / 2;

/** A point on the ring, measured clockwise from twelve o'clock. */
function pointAt(percent: number): { x: number; y: number } {
  const radians = (percent / 100) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTRE + DONUT_RADIUS * Math.cos(radians),
    y: CENTRE + DONUT_RADIUS * Math.sin(radians),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * One `d` per slice, as a real arc.
 *
 * Each slice used to be a full circle with a dash pattern sized to its share.
 * That draws correctly, but browsers hit-test a dashed stroke as the whole
 * path: every slice covered the entire ring, so a click anywhere landed on
 * whichever was drawn last. Clicking the biggest holding opened the smallest.
 */
export function slicePaths(segments: readonly DonutSegment[]): { id: string; d: string }[] {
  let start = 0;

  return segments.map((segment) => {
    const share = Math.max(segment.percent, 0);
    const end = Math.min(start + share, 100);

    let d: string;
    if (share >= 100) {
      // A single holding is the whole ring, where an arc from a point back to
      // itself would collapse to nothing. Two half-arcs close it.
      const top = CENTRE - DONUT_RADIUS;
      const bottom = CENTRE + DONUT_RADIUS;
      d = `M ${CENTRE} ${top} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 1 1 ${CENTRE} ${bottom} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 1 1 ${CENTRE} ${top}`;
    } else {
      const from = pointAt(start);
      const to = pointAt(end);
      const largeArc = end - start > 50 ? 1 : 0;
      d = `M ${round(from.x)} ${round(from.y)} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 ${largeArc} 1 ${round(to.x)} ${round(to.y)}`;
    }

    start = end;
    return { id: segment.id, d };
  });
}
