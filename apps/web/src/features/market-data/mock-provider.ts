import type { MarketDataProvider, MarketStatus, Quote } from '@dcafolio/shared';

/**
 * A deterministic, obviously synthetic price source.
 *
 * It exists so the rest of DCAfolio can be built and demonstrated without a
 * verified free provider. It must never be mistaken for a real quote: the UI
 * labels every `mock` price as mock, and `getMarketStatus` reports `unknown`
 * rather than inventing an open/closed state.
 *
 * Prices are derived from the symbol itself, so the same symbol always yields
 * the same number and nothing looks like live movement.
 */
function syntheticPrice(symbol: string): string {
  let hash = 0;
  for (const character of symbol) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100_000;
  }
  // 10.00 – 259.99, a plausible SET range, with no pretence of accuracy.
  const baht = 10 + (hash % 250);
  const satang = hash % 100;
  return `${baht}.${String(satang).padStart(2, '0')}`;
}

export class MockMarketDataProvider implements MarketDataProvider {
  readonly id = 'mock';

  constructor(private readonly now: () => Date = () => new Date()) {}

  async getQuote(symbol: string): Promise<Quote | null> {
    const normalised = symbol.trim().toUpperCase();
    if (!normalised) return null;

    return {
      symbol: normalised,
      price: syntheticPrice(normalised),
      provider: this.id,
      capturedAt: this.now().toISOString(),
    };
  }

  async getQuotes(symbols: string[]): Promise<Record<string, Quote | null>> {
    const quotes: Record<string, Quote | null> = {};
    for (const symbol of symbols) {
      quotes[symbol] = await this.getQuote(symbol);
    }
    return quotes;
  }

  async getMarketStatus(): Promise<MarketStatus> {
    // A mock cannot know whether the SET is open, and guessing would be a lie.
    return { state: 'unknown', provider: this.id, checkedAt: this.now().toISOString() };
  }
}
