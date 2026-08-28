import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HistorySkeleton } from '@/features/transactions/HistorySkeleton';
import { StockDetailSkeleton } from '@/features/portfolio/StockDetailSkeleton';
import { StockMasterSkeleton } from '@/features/stocks/StockMasterSkeleton';
import { phrase } from '@/test/i18n-harness';

/**
 * The same three rules for every skeleton, because breaking any of them turns a
 * loading state into a claim about data that has not arrived.
 */
const SKELETONS = [
  {
    name: 'HistorySkeleton',
    render: () => render(<HistorySkeleton />),
    label: phrase('history.loadingTransactions'),
  },
  {
    name: 'StockDetailSkeleton',
    render: () => render(<StockDetailSkeleton symbol="CPALL" />),
    label: phrase('stock.loading', { symbol: 'CPALL' }),
  },
  {
    name: 'StockMasterSkeleton',
    render: () => render(<StockMasterSkeleton />),
    label: phrase('common.loading'),
  },
];

describe.each(SKELETONS)('$name', ({ render: renderIt, label }) => {
  it('says what is being waited for, in words', () => {
    renderIt();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent(label);
  });

  it('hides its placeholder shapes from assistive technology', () => {
    const { container } = renderIt();
    const blocks = container.querySelectorAll('.animate-pulse');

    expect(blocks.length).toBeGreaterThan(3);
    for (const block of blocks) expect(block).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows no text beyond that one sentence', () => {
    // Not even a zero or a placeholder symbol: it would be read as data.
    const { container } = renderIt();

    expect(container.textContent?.replace(label, '').trim()).toBe('');
  });
});
