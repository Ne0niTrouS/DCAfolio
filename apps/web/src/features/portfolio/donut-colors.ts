/**
 * Shades of the one accent colour, cycled.
 *
 * Allocation is also printed as a number beside every row, so the chart never
 * has to carry the meaning alone — which is what makes reusing a shade past the
 * sixth stock acceptable.
 */
export const DONUT_COLORS = [
  '#16a34a',
  '#22c55e',
  '#4ade80',
  '#15803d',
  '#86efac',
  '#166534',
] as const;

export function donutColor(index: number): string {
  return DONUT_COLORS[index % DONUT_COLORS.length] as string;
}
