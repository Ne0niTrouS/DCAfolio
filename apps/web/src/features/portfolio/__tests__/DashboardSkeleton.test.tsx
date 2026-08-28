import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { DashboardSkeleton } from '../DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('says what is being waited for, in words', () => {
    render(<DashboardSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent(phrase('dashboard.loadingPortfolio'));
  });

  it('hides the placeholder shapes from assistive technology', () => {
    // A screen reader should hear the sentence once, not a hundred unlabelled
    // boxes.
    const { container } = render(<DashboardSkeleton />);
    const blocks = container.querySelectorAll('.animate-pulse');

    expect(blocks.length).toBeGreaterThan(10);
    for (const block of blocks) expect(block).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows no figures at all, not even zeroes', () => {
    // A placeholder shaped like a number is the one thing a loading state must
    // never be: it would be read as data that has arrived.
    const { container } = render(<DashboardSkeleton />);
    const visible = container.textContent?.replace(phrase('dashboard.loadingPortfolio'), '');

    expect(visible?.trim()).toBe('');
  });
});
