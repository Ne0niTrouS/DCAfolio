import { describe, expect, it, vi } from 'vitest';

import { MockMarketDataProvider } from '../mock-provider';
import { resolveMarketDataProvider } from '../provider';

const NOW = new Date('2026-08-20T10:00:00.000Z');

describe('MockMarketDataProvider', () => {
  const provider = new MockMarketDataProvider(() => NOW);

  it('identifies itself as mock so every price can be labelled', () => {
    expect(provider.id).toBe('mock');
  });

  it('returns the same synthetic price for the same symbol every time', async () => {
    const first = await provider.getQuote('CPALL');
    const second = await provider.getQuote('CPALL');

    expect(first).toEqual(second);
    expect(first?.provider).toBe('mock');
    expect(first?.capturedAt).toBe(NOW.toISOString());
  });

  it('gives different symbols different prices', async () => {
    const cpall = await provider.getQuote('CPALL');
    const ptt = await provider.getQuote('PTT');

    expect(cpall?.price).not.toBe(ptt?.price);
  });

  it('produces a plausible, well-formed baht amount', async () => {
    const quote = await provider.getQuote('CPALL');

    expect(quote?.price).toMatch(/^\d+\.\d{2}$/);
    expect(Number(quote?.price)).toBeGreaterThan(0);
  });

  it('normalises the symbol and rejects an empty one', async () => {
    expect((await provider.getQuote('  cpall '))?.symbol).toBe('CPALL');
    expect(await provider.getQuote('   ')).toBeNull();
  });

  it('answers for every requested symbol at once', async () => {
    const quotes = await provider.getQuotes(['CPALL', 'PTT', '']);

    expect(Object.keys(quotes)).toEqual(['CPALL', 'PTT', '']);
    expect(quotes['']).toBeNull();
  });

  it('refuses to guess whether the market is open', async () => {
    const status = await provider.getMarketStatus();

    expect(status).toEqual({
      state: 'unknown',
      provider: 'mock',
      checkedAt: NOW.toISOString(),
    });
  });
});

describe('resolveMarketDataProvider', () => {
  it('returns the configured provider', () => {
    expect(resolveMarketDataProvider('mock').id).toBe('mock');
  });

  it('falls back to the mock rather than breaking the app on a bad configuration', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveMarketDataProvider('does-not-exist').id).toBe('mock');
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
