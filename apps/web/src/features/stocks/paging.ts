/** Rows per page in the stock register. */
export const PAGE_SIZE = 20;

export type Page<T> = {
  items: T[];
  /** 1-based, clamped into range. */
  page: number;
  pageCount: number;
  /** 1-based index of the first and last item shown, for "12–20 of 35". */
  from: number;
  to: number;
  total: number;
};

/**
 * One page of a list, with the numbers needed to describe it.
 *
 * The requested page is clamped rather than trusted: a search that narrows the
 * list while the reader is on page 3 would otherwise show an empty page and no
 * way back, which reads as "no results" for a search that has plenty.
 *
 * An empty list is page 1 of 1 showing 0–0, so the caller never has to special-
 * case it to avoid printing "1–0 of 0".
 */
export function paginate<T>(items: readonly T[], page: number, size = PAGE_SIZE): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(Math.trunc(page) || 1, 1), pageCount);

  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);

  return {
    items: slice,
    page: current,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
    total,
  };
}
