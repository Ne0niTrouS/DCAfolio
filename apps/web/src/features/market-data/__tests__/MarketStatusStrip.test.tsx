import type { MarketPrice } from '@dcafolio/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { MarketStatusStrip } from '../MarketStatusStrip';

function price(overrides: Partial<MarketPrice> = {}): MarketPrice {
  return {
    stockId: 'stock-ptt',
    symbol: 'PTT',
    price: '40.25',
    provider: 'yahoo',
    capturedAt: '2026-08-27T09:00:00.000Z',
    status: 'fresh',
    ...overrides,
  };
}

function syncButton() {
  return screen.getByRole('button', { name: phrase('market.sync') });
}

describe('MarketStatusStrip', () => {
  it('names the provider so a number is never anonymous', () => {
    render(<MarketStatusStrip prices={[price()]} />);

    expect(screen.getByText(phrase('market.provider', { provider: 'yahoo' }))).toBeInTheDocument();
  });

  it('warns that a mock price is not a real one', () => {
    render(<MarketStatusStrip prices={[price({ provider: 'mock' })]} />);

    expect(screen.getByText(phrase('market.mockBadge'))).toBeInTheDocument();
  });

  it('marks a cached price rather than passing it off as current', () => {
    render(<MarketStatusStrip prices={[price({ status: 'stale' })]} />);

    expect(screen.getByText(phrase('market.cachedBadge'))).toBeInTheDocument();
  });

  it('offers no refresh when there is nothing to refresh', () => {
    render(<MarketStatusStrip prices={[price()]} />);

    expect(screen.queryByRole('button', { name: phrase('market.sync') })).not.toBeInTheDocument();
  });

  it('asks for a refresh when the button is pressed', async () => {
    const onSync = vi.fn();
    render(<MarketStatusStrip prices={[price()]} onSync={onSync} />);

    await userEvent.click(syncButton());

    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('blocks a second press while one refresh is still running', async () => {
    const onSync = vi.fn();
    render(<MarketStatusStrip prices={[price()]} onSync={onSync} syncing />);

    const button = screen.getByRole('button', { name: phrase('common.working') });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onSync).not.toHaveBeenCalled();
  });

  it('reports the outcome of the last refresh', () => {
    render(
      <MarketStatusStrip
        prices={[price()]}
        onSync={() => {}}
        syncNote={phrase('market.syncSkipped', { minutes: 12 })}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      phrase('market.syncSkipped', { minutes: 12 }),
    );
  });
});
