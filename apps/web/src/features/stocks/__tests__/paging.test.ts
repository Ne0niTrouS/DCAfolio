import { describe, expect, it } from 'vitest';

import { PAGE_SIZE, paginate } from '../paging';

const items = Array.from({ length: 35 }, (_, index) => index + 1);

describe('paginate', () => {
  it('returns the first page and describes it', () => {
    const page = paginate(items, 1);

    expect(page.items).toHaveLength(PAGE_SIZE);
    expect(page.items[0]).toBe(1);
    expect(page).toMatchObject({ page: 1, pageCount: 2, from: 1, to: 20, total: 35 });
  });

  it('counts a partial last page correctly', () => {
    const page = paginate(items, 2);

    expect(page.items).toHaveLength(15);
    expect(page).toMatchObject({ page: 2, from: 21, to: 35, total: 35 });
  });

  it('clamps a page past the end rather than showing nothing', () => {
    // A search that shortens the list while the reader is on page 3 would
    // otherwise show an empty page, which reads as "no results" for a search
    // that has plenty.
    const page = paginate(items, 9);

    expect(page.page).toBe(2);
    expect(page.items).toHaveLength(15);
  });

  it('clamps a page below the start', () => {
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate(items, -4).page).toBe(1);
  });

  it('describes an empty list without printing 1–0 of 0', () => {
    expect(paginate([], 1)).toMatchObject({ page: 1, pageCount: 1, from: 0, to: 0, total: 0 });
  });

  it('is a single page when everything fits', () => {
    const page = paginate(items.slice(0, 20), 1);

    expect(page.pageCount).toBe(1);
    expect(page).toMatchObject({ from: 1, to: 20 });
  });

  it('honours an explicit page size', () => {
    const page = paginate(items, 4, 10);

    expect(page).toMatchObject({ page: 4, pageCount: 4, from: 31, to: 35 });
  });
});
