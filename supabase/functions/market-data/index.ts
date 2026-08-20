// DCAfolio — market-data Edge Function (Deno).
//
// The browser never calls a market-data provider directly: API secrets would be
// exposed and the price cache is not writable by clients. This function is the
// only writer of public.market_prices.
//
// Failure path (design.md section 9.4): when the provider cannot supply a quote,
// the last successful price is re-published with is_stale = true, so the
// dashboard keeps working and the UI can say plainly that the number is cached.
//
// V1 uses the mock provider. See docs/specs/market-data-providers.md — no free
// source of Thai SET quotes could be verified, and no real price is fabricated.

import { createClient } from 'jsr:@supabase/supabase-js@2';

type Quote = {
  symbol: string;
  price: string;
  provider: string;
  capturedAt: string;
};

interface MarketDataProvider {
  readonly id: string;
  getQuotes(symbols: string[]): Promise<Record<string, Quote | null>>;
}

/** Deterministic and obviously synthetic. Never presented as a real quote. */
function syntheticPrice(symbol: string): string {
  let hash = 0;
  for (const character of symbol) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100_000;
  }
  const baht = 10 + (hash % 250);
  const satang = hash % 100;
  return `${baht}.${String(satang).padStart(2, '0')}`;
}

const mockProvider: MarketDataProvider = {
  id: 'mock',
  getQuotes(symbols) {
    const capturedAt = new Date().toISOString();
    const quotes: Record<string, Quote | null> = {};
    for (const symbol of symbols) {
      quotes[symbol] = { symbol, price: syntheticPrice(symbol), provider: 'mock', capturedAt };
    }
    return Promise.resolve(quotes);
  },
};

function resolveProvider(id: string): MarketDataProvider {
  // Register a verified provider here; the rest of this function is unchanged.
  if (id !== 'mock') {
    console.warn(`Unknown market data provider "${id}"; using the mock provider.`);
  }
  return mockProvider;
}

Deno.serve(async (request) => {
  // Secrets stay server-side. The service-role key bypasses RLS, which is why
  // it must never be exposed to a browser or placed in a VITE_ variable.
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const providerId = Deno.env.get('MARKET_DATA_PROVIDER') ?? 'mock';

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Function is not configured' }, { status: 500 });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Only refresh stocks somebody actually holds — the free tiers this project
  // targets are rate limited, and unheld symbols cost quota for nothing.
  const { data: held, error: heldError } = await supabase
    .from('transactions')
    .select('stock_id, stocks ( id, symbol )');

  if (heldError) {
    return Response.json({ error: heldError.message }, { status: 500 });
  }

  const stocks = new Map<string, string>();
  for (const row of held ?? []) {
    const stock = (row as { stocks: { id: string; symbol: string } | null }).stocks;
    if (stock) stocks.set(stock.symbol, stock.id);
  }

  if (stocks.size === 0) {
    return Response.json({ provider: providerId, captured: 0, stale: 0 });
  }

  const provider = resolveProvider(providerId);

  let quotes: Record<string, Quote | null> = {};
  let providerFailed = false;
  try {
    quotes = await provider.getQuotes([...stocks.keys()]);
  } catch (error) {
    providerFailed = true;
    console.error('Market data provider failed:', error);
  }

  const rows: {
    stock_id: string;
    price: string;
    provider: string;
    captured_at: string;
    is_stale: boolean;
  }[] = [];
  const stale: string[] = [];

  for (const [symbol, stockId] of stocks) {
    const quote = providerFailed ? null : quotes[symbol];

    if (quote) {
      rows.push({
        stock_id: stockId,
        price: quote.price,
        provider: quote.provider,
        captured_at: quote.capturedAt,
        is_stale: false,
      });
      continue;
    }

    // Re-publish the last successful price, marked stale, so the dashboard
    // still has a number and the UI can say it is cached.
    const { data: previous } = await supabase
      .from('market_prices')
      .select('price, provider')
      .eq('stock_id', stockId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previous) {
      rows.push({
        stock_id: stockId,
        price: String(previous.price),
        provider: String(previous.provider),
        captured_at: new Date().toISOString(),
        is_stale: true,
      });
      stale.push(symbol);
    }
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('market_prices').insert(rows);
    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }
  }

  return Response.json({
    provider: providerId,
    captured: rows.length - stale.length,
    stale: stale.length,
    providerFailed,
  });
});
