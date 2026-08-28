import type { Position } from '@dcafolio/calculation';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { PositionList } from '../PositionList';

function position(symbol: string, allocation: number): Position {
  return {
    stockId: `stock-${symbol}`,
    symbol,
    nameTh: `บริษัท ${symbol}`,
    totalInvested: '1000.00',
    totalShares: '100',
    averageCost: '10.00',
    currentPrice: '11.00',
    currentValue: '1100.00',
    profitLoss: '100.00',
    returnPercent: 10,
    allocationPercent: allocation,
    transactionCount: 1,
    priceStatus: 'fresh',
    provider: 'yahoo',
    priceCapturedAt: '2026-08-28T09:00:00.000Z',
  };
}

function list(count: number) {
  const positions = Array.from({ length: count }, (_, index) =>
    position(`SYM${index}`, 100 / count),
  );

  render(
    <MemoryRouter>
      <PositionList positions={positions} totalInvested="1000.00" />
    </MemoryRouter>,
  );
}

describe('PositionList', () => {
  it('makes every ring slice a link to its holding', () => {
    list(3);

    // The ring is a summary of the same rows; being able to click it should not
    // depend on finding the matching row first.
    expect(screen.getByRole('link', { name: /^SYM0 33\.33%$/ })).toHaveAttribute(
      'href',
      '/stocks/SYM0',
    );
  });

  it('offers no view-all button when everything is already listed', () => {
    list(3);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('caps a long portfolio and says how many there are', () => {
    list(8);

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(
      screen.getByRole('button', { name: phrase('dashboard.viewAllHoldings', { count: 8 }) }),
    ).toBeInTheDocument();
  });

  it('reveals the rest in place', async () => {
    list(8);

    await userEvent.click(
      screen.getByRole('button', { name: phrase('dashboard.viewAllHoldings', { count: 8 }) }),
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(
      screen.getByRole('button', { name: phrase('dashboard.showFewer') }),
    ).toBeInTheDocument();
  });

  it('keeps the ring complete even while the list is capped', () => {
    list(8);

    // Hiding a slice would misstate the allocation, which is the one thing the
    // ring is for.
    expect(screen.getByRole('link', { name: /^SYM7 12\.50%$/ })).toBeInTheDocument();
  });
});
