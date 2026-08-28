import type { Position } from '@dcafolio/calculation';
import { render, screen, within } from '@testing-library/react';
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

/** Shares that are distinct and readable: 50%, 30%, then 20% split evenly. */
function shares(count: number): number[] {
  if (count <= 3) return [50, 30, 20].slice(0, count);
  return [50, 30, ...Array.from({ length: count - 2 }, () => 20 / (count - 2))];
}

function list(count: number) {
  const positions = shares(count).map((share, index) => position(`SYM${index}`, share));

  render(
    <MemoryRouter>
      <PositionList positions={positions} totalInvested="1000.00" />
    </MemoryRouter>,
  );
}

function slice(name: RegExp) {
  return screen.getByRole('button', { name });
}

function centre() {
  return screen.getByRole('link', { name: /^SYM\d+ \d/ });
}

/** Scoped to the list, because the centre link carries the same names. */
function rows() {
  return within(screen.getByRole('list'));
}

describe('PositionList', () => {
  it('names the biggest holding and its share before anything is pressed', () => {
    list(3);

    expect(centre()).toHaveAccessibleName('SYM0 50.00%');
    expect(centre()).toHaveTextContent('50.00%');
  });

  it('reports the share of the slice that was pressed', async () => {
    // Pressing a slice used to navigate away, so the one thing a reader presses
    // a chart to find out was the one thing the press did not tell them.
    list(3);

    await userEvent.click(slice(/^SYM2 20\.00%$/));

    expect(centre()).toHaveAccessibleName('SYM2 20.00%');
    expect(centre()).toHaveTextContent('20.00%');
  });

  it('keeps the holding one interaction away, from the centre', async () => {
    list(3);

    await userEvent.click(slice(/^SYM1 30\.00%$/));

    expect(centre()).toHaveAttribute('href', '/stocks/SYM1');
  });

  it('answers the keyboard as well as the mouse', async () => {
    list(3);

    slice(/^SYM1 30\.00%$/).focus();
    await userEvent.keyboard('{Enter}');

    expect(centre()).toHaveAccessibleName('SYM1 30.00%');
  });

  it('marks the pressed slice and its row', async () => {
    list(3);

    await userEvent.click(slice(/^SYM2 20\.00%$/));

    expect(slice(/^SYM2 20\.00%$/)).toHaveAttribute('aria-pressed', 'true');
    expect(slice(/^SYM0 50\.00%$/)).toHaveAttribute('aria-pressed', 'false');
    expect(rows().getByRole('link', { name: /SYM2/ })).toHaveAttribute('aria-current', 'true');
  });

  it('prints every share as text whatever is pressed', () => {
    list(3);

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]!).getByText('50.00%')).toBeInTheDocument();
    expect(within(items[2]!).getByText('20.00%')).toBeInTheDocument();
  });

  it('offers no view-all button when everything is already listed', () => {
    list(3);

    expect(screen.queryByRole('button', { name: /ดูทั้งหมด|View all/ })).not.toBeInTheDocument();
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
    expect(slice(/^SYM7 /)).toBeInTheDocument();
  });

  it('brings a pressed slice into the list when the cap had hidden it', async () => {
    list(8);
    expect(rows().queryByRole('link', { name: /SYM7/ })).not.toBeInTheDocument();

    await userEvent.click(slice(/^SYM7 /));

    // Otherwise pressing it changes the centre and nothing else, leaving the
    // exact figure with nowhere to appear.
    expect(rows().getByRole('link', { name: /SYM7/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
  });
});
