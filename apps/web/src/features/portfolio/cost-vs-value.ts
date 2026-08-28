/**
 * The width of the value bar relative to cost, as a percentage.
 *
 * Layout only — never money, which is why plain `number` arithmetic is fine
 * here and nowhere near the figures printed beside it. Capped at 100 so a
 * portfolio that has doubled cannot push the bar out of its track, and `null`
 * whenever there is nothing honest to draw: no price yet, or a zero cost that
 * nothing can be measured against.
 *
 * Its own module rather than a second export from the component, so the file
 * holding the component holds only components.
 */
export function barPercent(invested: string, value: string | null): number | null {
  if (value === null) return null;

  const cost = Number(invested);
  const worth = Number(value);
  if (!Number.isFinite(cost) || !Number.isFinite(worth) || cost <= 0) return null;

  return Math.max(0, Math.min(100, (worth / cost) * 100));
}
