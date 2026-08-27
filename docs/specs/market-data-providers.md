# Market Data Provider Evaluation

First evaluated: **2026-08-20**. Revised: **2026-08-27**. Decision owner: DCAfolio (personal
project). Related: [`design.md`](design.md) §9 · [`../../context.md`](../../context.md) §8

## Decision

**DCAfolio reads real Thai SET prices from Yahoo Finance's undocumented chart endpoint, as a risk
the project owner has explicitly accepted.**

This reverses the 2026-08-20 decision, which rejected every candidate and shipped
`MockMarketDataProvider` as the only option. Nothing about the evidence changed — the rejection
rested on the rule *"unauthorized scraping is not permitted"* in `context.md` §8, and the owner
has since decided to relax that rule for this one provider, in writing, knowing the cost. See
`context.md` §8.1.

`MockMarketDataProvider` remains and stays labelled as mock. Reversing this decision is one
secret: `MARKET_DATA_PROVIDER=mock`.

## Criteria (from `context.md` §8)

A provider qualifies for V1 only if **all** of the following are verified, not assumed:

1. Supports Thai SET symbols.
2. Currently available.
3. Free tier sufficient for one person's daily use.
4. API terms permit this use.
5. Personal, non-commercial use is allowed.
6. API-key requirement is understood.
7. No unauthorized scraping involved.

Yahoo satisfies 1, 2, 3 and 6, and **fails 4, 5 and 7**. It is adopted anyway, under §8.1.

## Candidates evaluated

| Provider | Thai SET on the free tier? | Verdict |
| --- | --- | --- |
| **Yahoo Finance** (`query1.finance.yahoo.com/v8/finance/chart/SYMBOL.BK`) | Yes. Verified live 2026-08-27 — see the evidence below. | **Adopted, with accepted risk.** Fails criteria 4, 5 and 7. |
| **Twelve Data** | No. The Basic (free) plan covers **3 exchanges**, described as *"Real-time US equities and ETFs"*, plus forex and crypto, with "global trial symbols" only. | Rejected — free tier does not include the SET. |
| **Finnhub** | No. The free tier is US market data; international coverage requires a paid Premium plan. | Rejected — Thai coverage is behind payment. |
| **Alpha Vantage** | Unverified. The documentation lists suffixes for London, Toronto, XETRA, BSE, Shanghai and Shenzhen, and claims 100,000+ symbols, but **mentions no Thailand / Bangkok / `.BK` suffix anywhere**. | Rejected — coverage cannot be confirmed. |
| **Marketstack** | Unverified, and unsuitable regardless. The free plan is **100 requests/month, end-of-day only**, with commercial use restricted to paid tiers; Thai exchange inclusion is not stated. | Rejected — coverage unconfirmed and the free quota is impractical. |
| **SET official (set.or.th)** | The exchange publishes market data, but the free offering found is an **ESG dataset**, not a quote feed. SET Market Data is a commercial product. | Rejected — V1 must not require a paid SET API. |
| **`UncleEngineer/ThaiStock`** (suggested 2026-08-27) | Moot. Python library, MIT, 31 stars, **last code commit 2022-06-21**. It scrapes `classic.settrade.com` HTML with BeautifulSoup; that host now returns **NXDOMAIN** (`dns.google can't find classic.settrade.com.: Non-existent domain`). | Rejected — the source it depends on no longer exists, it is Python where the Edge Function is Deno, and HTML scraping of settrade fails criterion 7 exactly as Yahoo does. |

## What was verified about Yahoo, and how

Measured 2026-08-27 with `curl` against `query1.finance.yahoo.com`.

| Question | Result |
| --- | --- |
| Does it carry SET symbols? | Yes. `PTT.BK`, `CPALL.BK`, `AOT.BK` all answer `200` with `"exchangeName":"SET"`, `"currency":"THB"`, `"fullExchangeName":"Thailand"`. |
| Is an API key needed? | No. |
| Can several symbols be fetched at once? | **No.** `/v7/finance/quote?symbols=…` answers `401 Unauthorized` without a session crumb. One request per symbol, via `/v8/finance/chart/`. |
| Does it work without a `User-Agent`? | **No.** An otherwise identical request with no `User-Agent` header returns `429 Too Many Requests` on the first call, every time. With a browser `User-Agent` it returns `200`. |
| What does an unknown symbol do? | `404` with `{"chart":{"result":null,"error":{"code":"Not Found",…}}}` — distinguishable from a provider outage. |
| Is the market state knowable? | Yes. `meta.currentTradingPeriod.regular.start`/`.end` give the exchange's own trading window, so open/closed is read rather than guessed from hard-coded hours (which would call a public holiday a trading day). |

## How the risk is contained

- **Server-side only.** `supabase/functions/market-data/index.ts` is the sole caller. The browser
  never touches Yahoo, so no reader's address is exposed and no CORS workaround is needed.
  `isClientResolvable()` in `apps/web/src/features/market-data/provider.ts` keeps the web app
  from ever resolving `yahoo` locally.
- **Held symbols only.** The function reads the symbols that actually appear in `transactions`.
  An unheld stock costs a request and produces a price nothing reads.
- **Cooldown, enforced on the server.** `SYNC_COOLDOWN_MINUTES` (15) is checked against the
  newest cached `captured_at` before the provider is called. A rejected call returns
  `{ skipped: true, retryInMinutes }`. This is deliberately not a disabled button: a browser
  reload loop presses nothing and would otherwise fetch on every page load.
- **Every parse fails to `null`.** `supabase/functions/_shared/yahoo.ts` rejects a payload of the
  wrong shape, a non-`THB` currency (a Thai ticker can collide with a listing elsewhere, and
  recording dollars as baht would corrupt every profit figure downstream), and any price that is
  not a finite positive number. A `null` quote re-publishes the cached price marked stale.
- **Closed-market prices are flagged.** A quote fetched while the SET is shut is the previous
  close however fresh the request was, so it is written with `is_stale = true` and the UI says
  *"cached"*. Tied to Yahoo's reported trading window, not to an age threshold.
- **Float repair, not rounding away precision.** Yahoo stores prices as 32-bit floats, so a clean
  ฿1.30 arrives as `1.2999999523162842`. The SET's smallest tick is ฿0.01, which makes two
  decimals the correct representation rather than a loss.

The parsing is pure and lives in `_shared/yahoo.ts` precisely so it can be tested: the Edge
Function itself cannot be run by Vitest, and `supabase/tests/yahoo.test.ts` exercises the parts
that can get the numbers wrong against a recorded payload. That recording is also the limit of
those tests — if Yahoo changes shape they will keep passing while production degrades to cached
prices, which is the intended failure, not a silent wrong answer.

## Consequences

- The dashboard, stock detail and position list all render correctly with **no price at all**:
  invested amount, share count and average cost remain available, and price-dependent figures
  show `—`. This path is covered by tests and is what a Yahoo outage looks like.
- The market strip names the provider and the capture age, shows a *Cached* badge for anything
  stale, and reports what each refresh actually achieved — a refresh that fetched nothing must
  not read like one that worked.
- With `MARKET_DATA_PROVIDER=mock`, `getMarketStatus()` returns `unknown`. A mock cannot know
  whether the SET is open.
- Known gap: the cooldown counts from the newest cached row, so a user whose cache is completely
  empty *and* whose provider is failing has nothing to count from and can retry freely. Closing
  it properly needs a request-log table, which is a schema change and outside V1 scope.

## Re-evaluation triggers

Revisit if any of the following becomes true:

- **Yahoo stops answering, changes shape, or blocks the requests.** The expected symptom is every
  price going stale at once and `syncFailed` on the strip. Fall back with
  `MARKET_DATA_PROVIDER=mock`.
- The owner withdraws the §8.1 acceptance.
- A provider documents Thai SET coverage on a free tier with terms permitting personal use —
  which would remove the reason to accept this risk at all.
- The owner accepts a paid data plan (an explicit scope and cost decision — see `CLAUDE.md` §3.3).
- SET publishes a free quote API for personal use.

## Sources

- [Twelve Data pricing](https://twelvedata.com/pricing)
- [Finnhub pricing](https://finnhub.io/pricing) and
  [Finnhub API documentation](https://finnhub.io/docs/api)
- [Alpha Vantage API documentation](https://www.alphavantage.co/documentation/)
- [Marketstack product page](https://marketstack.com/product)
- [The Stock Exchange of Thailand](https://www.set.or.th/en/home)
- [`UncleEngineer/ThaiStock`](https://github.com/UncleEngineer/ThaiStock)
- Yahoo Finance: no published API documentation exists. Everything in the table above was
  measured directly, which is itself part of the risk being accepted.
