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
    capturedAt: new Date().toISOString(),
    status: 'fresh',
    ...overrides,
  };
}

function syncButton() {
  return screen.getByRole('button', { name: phrase('market.sync') });
}

describe('MarketStatusStrip', () => {
  it('names the source so a number is never anonymous', () => {
    render(<MarketStatusStrip prices={[price()]} />);

    expect(
      screen.getByText(phrase('market.source', { source: 'Yahoo Finance' })),
    ).toBeInTheDocument();
  });

  it('says prices are current when they are', () => {
    render(<MarketStatusStrip prices={[price()]} />);

    expect(
      screen.getByText(phrase('market.updatedAgo', { time: phrase('time.justNow') })),
    ).toBeInTheDocument();
    expect(screen.queryByText(phrase('market.mayBeOutdated'))).not.toBeInTheDocument();
    expect(screen.queryByText(phrase('market.cachedBadge'))).not.toBeInTheDocument();
  });

  it('warns and gives an exact time when prices are old', () => {
    render(<MarketStatusStrip prices={[price({ status: 'stale' })]} />);

    expect(screen.getByText(phrase('market.mayBeOutdated'))).toBeInTheDocument();
    // The relative phrasing is not enough here: "out of date" is only
    // actionable if the reader can see how out of date.
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('says plainly when there is no price data at all', () => {
    render(<MarketStatusStrip prices={[]} />);

    expect(screen.getByText(phrase('market.noPricesYet'))).toBeInTheDocument();
  });

  it('warns that a mock price is not a real one', () => {
    render(<MarketStatusStrip prices={[price({ provider: 'mock' })]} />);

    expect(screen.getByText(phrase('market.mockBadge'))).toBeInTheDocument();
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
    render(<MarketStatusStrip prices={[price()]} onSync={onSync} sync={{ kind: 'loading' }} />);

    expect(syncButton()).toBeDisabled();
    expect(screen.getByText(phrase('market.syncing'))).toBeInTheDocument();

    await userEvent.click(syncButton());
    expect(onSync).not.toHaveBeenCalled();
  });

  it('reports how many prices were actually fetched', () => {
    render(
      <MarketStatusStrip
        prices={[price()]}
        onSync={() => {}}
        sync={{ kind: 'success', captured: 3, total: 3 }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(phrase('market.syncDoneTitle'));
    expect(screen.getByRole('status')).toHaveTextContent(
      phrase('market.syncCount', { captured: 3, total: 3 }),
    );
  });

  it('separates a partial refresh from a complete one', () => {
    render(
      <MarketStatusStrip
        prices={[price()]}
        onSync={() => {}}
        sync={{ kind: 'partial', captured: 2, total: 3 }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(phrase('market.syncPartialTitle'));
    expect(screen.getByRole('status')).toHaveTextContent(
      phrase('market.syncCount', { captured: 2, total: 3 }),
    );
  });

  it('never shows a success after a failed request', () => {
    render(
      <MarketStatusStrip
        prices={[price()]}
        onSync={() => {}}
        sync={{ kind: 'error', key: 'error.network' }}
      />,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(phrase('market.syncFailedTitle'));
    expect(status).toHaveTextContent(phrase('error.network'));
    expect(status).not.toHaveTextContent(phrase('market.syncDoneTitle'));
  });

  it('says how long the cooldown has left', () => {
    render(
      <MarketStatusStrip
        prices={[price()]}
        onSync={() => {}}
        sync={{ kind: 'skipped', retryInMinutes: 12 }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      phrase('market.syncSkipped', { minutes: 12 }),
    );
  });
});
