// DCAfolio — market-data Edge Function (Deno).
//
// The browser never calls a market-data provider directly: the price cache is
// not writable by clients, provider credentials must stay server-side, and a
// browser call would put the reader's own IP and a CORS wall in the way. This
// function is the only writer of public.market_prices.
//
// Failure path (design.md section 9.4): when the provider cannot supply a
// quote, the last successful price is re-published with is_stale = true, so the
// dashboard keeps working and the UI can say plainly that the number is cached.
//
// Provider selection is the MARKET_DATA_PROVIDER secret: `yahoo` for real SET
// prices, `mock` for obviously synthetic ones. See
// docs/specs/market-data-providers.md for what accepting `yahoo` costs.

import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  cooldownRemainingMinutes,
  parseMarketState,
  parseQuote,
  quoteUrl,
  REQUEST_USER_AGENT,
  staleFromMarketState,
  SYNC_COOLDOWN_MINUTES,
  YAHOO_PROVIDER_ID,
  type MarketState,
  type Quote,
} from '../_shared/yahoo.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Every reply carries CORS headers and a phrase key rather than a raw message.
 *
 * A Postgres error names tables and roles, and the person reading the dashboard
 * can do nothing with it; it belongs in the function log. What reaches the app
 * is a key it can translate — anything else arrives as "something went wrong",
 * which tells nobody anything.
 */
function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

type Batch = {
  quotes: Record<string, Quote | null>;
  marketState: MarketState;
};

interface MarketDataProvider {
  readonly id: string;
  getQuotes(symbols: string[]): Promise<Batch>;
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
    // A mock cannot know whether the SET is open, and guessing would be a lie.
    return Promise.resolve({ quotes, marketState: 'unknown' });
  },
};

/** Runs `worker` over `items`, never more than `limit` in flight at once. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]!);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Yahoo Finance, one request per symbol.
 *
 * The batch endpoint (`/v7/finance/quote?symbols=...`) answers 401 without a
 * session crumb, so there is no way to ask for several at once. Concurrency is
 * held to 4: enough that a dozen holdings refresh in about a second, low enough
 * not to arrive looking like a scraper.
 */
const yahooProvider: MarketDataProvider = {
  id: YAHOO_PROVIDER_ID,

  async getQuotes(symbols) {
    const now = new Date();
    const quotes: Record<string, Quote | null> = {};
    let marketState: MarketState = 'unknown';

    const payloads = await mapWithLimit(symbols, 4, async (symbol) => {
      try {
        const response = await fetch(quoteUrl(symbol), {
          headers: { 'User-Agent': REQUEST_USER_AGENT, Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        });

        // 404 says the symbol is unknown to Yahoo, which is a fact about that
        // one holding; any other status is a fact about the provider. Both
        // become a null quote, but only the second is worth a log line.
        if (!response.ok) {
          if (response.status !== 404) {
            console.warn(`Yahoo returned ${response.status} for ${symbol}`);
          }
          return { symbol, payload: null };
        }

        return { symbol, payload: (await response.json()) as unknown };
      } catch (error) {
        console.warn(`Yahoo request failed for ${symbol}:`, error);
        return { symbol, payload: null };
      }
    });

    for (const { symbol, payload } of payloads) {
      quotes[symbol] = payload === null ? null : parseQuote(symbol, payload, now);

      // Every SET listing reports the same trading window, so the first
      // readable payload settles it for the whole batch.
      if (marketState === 'unknown' && payload !== null) {
        marketState = parseMarketState(payload, now);
      }
    }

    return { quotes, marketState };
  },
};

function resolveProvider(id: string): MarketDataProvider {
  if (id === YAHOO_PROVIDER_ID) return yahooProvider;
  if (id !== 'mock') {
    console.warn(`Unknown market data provider "${id}"; using the mock provider.`);
  }
  return mockProvider;
}

async function handle(request: Request): Promise<Response> {
  // Secrets stay server-side. The service-role key bypasses RLS, which is why
  // it must never be exposed to a browser or placed in a VITE_ variable.
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const providerId = Deno.env.get('MARKET_DATA_PROVIDER') ?? 'mock';

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'error.serverConfig' }, 500);
  }

  if (request.method !== 'POST') {
    return json({ error: 'error.generic' }, 405);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Only refresh stocks somebody actually holds — an unheld symbol costs a
  // request and produces a price nothing on the dashboard reads.
  const { data: held, error: heldError } = await supabase
    .from('transactions')
    .select('stock_id, stocks ( id, symbol )');

  if (heldError) {
    // The raw Postgres message goes to the function log, not to the browser: it
    // names tables and roles, and the reader can do nothing with it anyway.
    console.error('Reading held stocks failed:', heldError);
    return json({ error: 'error.databaseUnavailable', stage: 'read-transactions' }, 500);
  }

  const stocks = new Map<string, string>();
  for (const row of held ?? []) {
    const stock = (row as { stocks: { id: string; symbol: string } | null }).stocks;
    if (stock) stocks.set(stock.symbol, stock.id);
  }

  if (stocks.size === 0) {
    return json({ provider: providerId, captured: 0, stale: 0, marketState: 'unknown' }, 200);
  }

  // Cooldown: the refresh button is one click, but a reload loop is no clicks
  // at all. Without this the provider sees a request per press of F5.
  const { data: newest } = await supabase
    .from('market_prices')
    .select('captured_at')
    .in('stock_id', [...stocks.values()])
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const waitMinutes = cooldownRemainingMinutes(
    newest ? String(newest.captured_at) : null,
    new Date(),
  );

  if (waitMinutes > 0) {
    return json(
      {
        provider: providerId,
        captured: 0,
        stale: 0,
        skipped: true,
        retryInMinutes: waitMinutes,
        cooldownMinutes: SYNC_COOLDOWN_MINUTES,
      },
      200,
    );
  }

  const provider = resolveProvider(providerId);

  let batch: Batch = { quotes: {}, marketState: 'unknown' };
  let providerFailed = false;
  try {
    batch = await provider.getQuotes([...stocks.keys()]);
  } catch (error) {
    providerFailed = true;
    console.error('Market data provider failed:', error);
  }

  // A provider that answered nothing usable has failed, whether or not it threw.
  if (!providerFailed && Object.values(batch.quotes).every((quote) => quote === null)) {
    providerFailed = true;
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
    const quote = providerFailed ? null : batch.quotes[symbol];

    if (quote) {
      const isStale = staleFromMarketState(batch.marketState);
      rows.push({
        stock_id: stockId,
        price: quote.price,
        provider: quote.provider,
        captured_at: quote.capturedAt,
        is_stale: isStale,
      });
      if (isStale) stale.push(symbol);
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
      console.error('Writing the price cache failed:', insertError);
      return json({ error: 'error.databaseUnavailable', stage: 'write-prices' }, 500);
    }
  }

  return json(
    {
      provider: providerId,
      captured: rows.length - stale.length,
      stale: stale.length,
      marketState: batch.marketState,
      providerFailed,
      cooldownMinutes: SYNC_COOLDOWN_MINUTES,
    },
    200,
  );
}

Deno.serve(async (request) => {
  // The browser sends a preflight before this POST, because the call carries an
  // Authorization header and a JSON content type. Answering it is not optional:
  // without these headers the browser discards the real response and the app
  // never learns why.
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    return await handle(request);
  } catch (error) {
    // An unhandled throw would otherwise return a bare 500 with a plain-text
    // body and no CORS headers — unreadable to the app, which could then only
    // say "something went wrong" about a failure nobody can see.
    console.error('Unhandled failure in market-data:', error);
    return json({ error: 'error.generic' }, 500);
  }
});
