# Market Data Provider Evaluation

Evaluated: **2026-08-20**. Decision owner: DCAfolio (personal project).
Related: [`design.md`](design.md) §9 · [`../../context.md`](../../context.md) §8

## Decision

**No free provider of Thai SET quotes could be verified against the required criteria.**
V1 therefore ships `MockMarketDataProvider` as the documented default. Its prices are
deterministic, obviously synthetic, and labelled *"Mock data — not real prices"* everywhere they
appear. **No real stock price is fabricated.**

The `MarketDataProvider` interface is in place, so adopting a verified provider later means
implementing one class and registering it in `apps/web/src/features/market-data/provider.ts`.
Nothing else in the application changes.

## Criteria (from `context.md` §8)

A provider qualifies for V1 only if **all** of the following are verified, not assumed:

1. Supports Thai SET symbols.
2. Currently available.
3. Free tier sufficient for one person's daily use.
4. API terms permit this use.
5. Personal, non-commercial use is allowed.
6. API-key requirement is understood.
7. No unauthorized scraping involved.

## Candidates evaluated

| Provider | Thai SET on the free tier? | Verdict |
| --- | --- | --- |
| **Twelve Data** | No. The Basic (free) plan covers **3 exchanges** and is described as *"Real-time US equities and ETFs"*, plus forex and crypto, with "global trial symbols" only. | **Rejected** — free tier does not include the SET. |
| **Finnhub** | No. The free tier is US market data; international coverage requires a paid Premium plan. | **Rejected** — Thai coverage is behind payment. |
| **Alpha Vantage** | Unverified. The documentation lists suffixes for London, Toronto, XETRA, BSE, Shanghai and Shenzhen, and claims 100,000+ symbols, but **mentions no Thailand / Bangkok / `.BK` suffix anywhere**. | **Rejected** — coverage cannot be confirmed, and criterion 1 forbids assuming it. |
| **Marketstack** | Unverified, and unsuitable regardless. The free plan is **100 requests/month, end-of-day only**, with commercial use restricted to paid tiers; Thai exchange inclusion is not stated. | **Rejected** — coverage unconfirmed and the free quota is impractical. |
| **Yahoo Finance (unofficial endpoints)** | Thai symbols do exist as `SYMBOL.BK`, but there is **no free public API**; the working endpoints are undocumented and their use is not authorised. | **Rejected** — criterion 7. Unauthorized scraping is not permitted. |
| **SET official (set.or.th)** | The exchange publishes market data, but the free API offering found is an **ESG dataset** (free to try during 2026), not a real-time or delayed quote feed. SET Market Data is a commercial product. | **Rejected** — V1 must not require a paid SET API. |

## Consequences

- The dashboard, stock detail and position list all render correctly with **no price at all**:
  invested amount, share count and average cost remain available, and price-dependent figures
  show `—` with an explanation. This path is covered by tests.
- The market strip always names the provider and the capture age, and shows a *Cached* badge
  when a price is older than `MARKET_PRICE_STALE_AFTER_MINUTES` (30).
- `getMarketStatus()` returns `unknown` for the mock provider. A mock cannot know whether the SET
  is open, and guessing would be dishonest.

## Re-evaluation triggers

Revisit this decision if any of the following becomes true:

- A provider documents Thai SET coverage on a free tier with terms permitting personal use.
- The owner accepts a paid data plan (an explicit scope and cost decision — see `CLAUDE.md` §3.3).
- SET publishes a free quote API for personal use.

## Sources

- [Twelve Data pricing](https://twelvedata.com/pricing)
- [Finnhub pricing](https://finnhub.io/pricing) and
  [Finnhub API documentation](https://finnhub.io/docs/api)
- [Alpha Vantage API documentation](https://www.alphavantage.co/documentation/)
- [Marketstack product page](https://marketstack.com/product)
- [The Stock Exchange of Thailand](https://www.set.or.th/en/home) ·
  [SET market overview](https://www.set.or.th/en/market/product/stock/overview)
