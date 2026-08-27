# context.md — DCAfolio Project Context

## 1. Why DCAfolio Exists

The owner invests regularly in Thai SET stocks using **DCA (Dollar-Cost Averaging)**: small,
repeated purchases over a long period. Broker statements are scattered across months, and after
a year of purchases the basic questions become hard to answer from memory:

- How much money have I actually put in?
- How many shares do I own of each stock?
- What is my average cost per share?
- What is the portfolio worth right now?
- Am I up or down, and by how much?

DCAfolio answers those five questions from a single source of truth: the list of purchases the
owner actually made.

## 2. Product Purpose

**DCAfolio — Personal Stock Portfolio Tracker.** Credit: NeOniTrouS. Version: V1.

A personal, single-user web application where the owner records each real stock purchase, and
the system derives the entire portfolio position automatically.

```
BUY STOCK -> RECORD PURCHASE -> CALCULATE COST -> GET MARKET PRICE
          -> CALCULATE CURRENT VALUE -> CALCULATE PROFIT/LOSS -> DASHBOARD
```

Design target: **a normal purchase is recorded in under 30 seconds** — four fields, one button.

It is a *record keeper and calculator*, not a trading terminal, not an advisor, and not a
financial-planning suite.

## 3. Locked V1 Scope

**Authentication** — login, logout, forgot password, session persistence, protected routes,
auth loading state, unauthorized state.

**Stocks** — Thai SET only. Stock master with symbol, Thai name, market, active flag.

**Portfolio** — multiple stocks, total invested, total shares, average cost, current price,
current value, profit/loss, return %, portfolio allocation.

**Transactions** — create, read, update, delete. Fields: purchase date, stock, invested amount,
shares received. Search, stock filter, date filter.

**Dashboard** — portfolio value, total invested, profit/loss, return %, DCA/month, allocation,
stock positions, recent transactions, market status, market-data last-updated.

**Stock detail** — symbol, Thai name, shares, total invested, average cost, current price,
current value, profit/loss, return %, purchase history.

**Market data** — provider abstraction, a free provider, cached latest price, market status
where available, last-updated timestamp, stale-data indication.

**Export** — CSV and XLSX; scopes: individual stock, monthly, yearly, all stocks / all time.

**UI** — responsive, mobile-first, desktop sidebar, mobile navigation, loading/empty/error
states.

**Testing** — unit tests, integration tests where appropriate, frontend tests where appropriate.

**Deployment** — GitHub, Cloudflare Pages, Supabase.

## 4. Out of Scope for V1

US stocks · Crypto · ETF · Mutual funds · TFEX · Sell transactions · Dividend tracking ·
Stock split · Tax calculation · Brokerage integration · Trading · Paid SET API requirement ·
Multi-user administration · Complex RBAC · Subscription billing · Notifications ·
Native mobile application · Advanced financial planning · Automated trading · Broker sync.

The architecture stays extensible toward these, but none of them ship in V1. A request outside
this list stops work and requires explicit approval (see `CLAUDE.md` §3.3).

## 5. Technology Direction

- **Frontend**: React + TypeScript + Vite + Tailwind CSS.
- **Backend platform**: **Supabase-first** — Auth, PostgreSQL, Row Level Security, Edge
  Functions. There is deliberately **no separate always-running Node/Express CRUD backend** in
  V1; the React app talks to Supabase directly and RLS is the authorization boundary.
- **Edge Functions** are used only where a server is genuinely required: calling an external
  market-data API with a secret, and writing to the price cache.
- **Monorepo** via npm workspaces: `apps/web`, `packages/calculation`, `packages/shared`.
  Business logic lives outside React so a future React Native / Expo client or a future REST
  API can reuse it unchanged.

## 6. Free-First Principle

DCAfolio is a personal project. **Target: zero recurring cost for normal personal V1 usage.**

Preferred stack: GitHub Free · Supabase Free · Cloudflare Pages Free · open-source libraries ·
free market-data providers.

V1 must **not require**: a paid SET Market Data API, a VPS, a paid backend server, a paid
analytics service, or a paid authentication service.

Optional future costs, only with explicit approval: a custom domain, paid market data, a
Supabase paid tier if usage outgrows the free limits.

No paid service may be introduced without explicit approval.

## 7. Transaction Source-of-Truth Principle

**Transactions are authoritative.** Everything else is derived.

The owner enters only what actually happened:

| Field | Example |
| --- | --- |
| Purchase date | 09/08/2026 |
| Stock | CPALL |
| Invested amount | 12,500 |
| Shares received | 200 |

The system computes price per share: `12,500 / 200 = ฿62.50`. The owner is **never** asked to
type the purchase price.

Consequences:

- Portfolio figures are never stored as mutable aggregates that can drift out of sync; they are
  recomputed from transactions.
- Editing or deleting a transaction automatically changes every derived figure.
- Market prices are cached separately and never mixed into the transaction record.

## 8. Market Data Principle

Market data is **untrusted, optional and isolated**.

- All access goes through a `MarketDataProvider` interface: `getQuote`, `getQuotes`,
  `getMarketStatus`. The dashboard and the calculation engine never depend on a concrete
  provider.
- Provider configuration allows a free provider, a free fallback and an optional official SET
  provider. **The default is a free provider.**
- Before adopting a real production provider we must verify: Thai SET symbol support, current
  availability, free-tier limits, API terms, personal-use compatibility, and whether an API key
  is required. Nothing is assumed to be free.
- If no reliable free provider can be verified, a **`MockMarketDataProvider`** is used for
  development and is clearly labelled as mock in the UI. **Real stock prices are never
  fabricated.**

### 8.1 Accepted risk: the Yahoo Finance endpoints

This rule previously read *"unauthorized scraping is not permitted"*, and on that basis every
candidate was rejected and V1 shipped with mock prices only. **The project owner has since
decided, knowing what follows, to use Yahoo Finance's undocumented quote endpoints** so that
DCAfolio shows real SET prices. Recorded here so the decision is not mistaken for an oversight.

What is being accepted:

- The endpoint is **undocumented, unsupported and not offered as a public API**. There is no
  agreement behind it and no notice period. It can change shape or stop answering on any day.
- Using it is **outside Yahoo's terms of service**. That is a real cost, weighed and accepted for
  a single-user personal tool, not a technicality that was overlooked.
- The data is **as good as Yahoo's**, which is a redistribution of SET data and is not the
  exchange's official record. It is adequate for tracking a personal position and is not adequate
  for anything that must reconcile with a broker statement.

What that decision does **not** relax:

- **Real stock prices are still never fabricated.** When the provider cannot answer, the cached
  price is re-published as stale — no number is invented, and `mock` prices stay labelled mock.
- **The browser never calls the provider.** All requests are made by the `market-data` Edge
  Function, which keeps the reader's own address out of it and leaves one auditable caller.
- **Request volume stays small and deliberate.** Only held symbols are fetched, and a cooldown
  (`SYNC_COOLDOWN_MINUTES`, 15) stands between the refresh button and the provider so that a
  reload loop cannot turn into a request flood.
- The provider stays behind `MarketDataProvider`. Withdrawing this decision means setting
  `MARKET_DATA_PROVIDER=mock` and changes nothing else.

The full evaluation, the evidence behind it and the conditions for reversing it are in
[`docs/specs/market-data-providers.md`](docs/specs/market-data-providers.md).
- Failure path: provider fails -> use the latest cached successful price -> mark it stale ->
  show last-updated time -> keep the dashboard functional. **Cached data is never presented as
  real-time.**
- Market data must never block the rest of the project.

## 9. Security Principle

- Row Level Security is mandatory and covers SELECT / INSERT / UPDATE / DELETE.
- The user can access only their own transactions and profile.
- Identity always comes from the authenticated Supabase session (`auth.uid()`), never from a
  client-supplied `user_id`.
- The stock master and the market-price cache are readable by any authenticated user, and
  writable only server-side.
- Service-role keys, private API keys, passwords and tokens are never exposed to the browser
  and never placed in `VITE_*` variables. `.env` files are never committed.

## 10. Export Principle

Exports exist so the owner's data is never trapped in the app.

- Formats: **CSV** and **XLSX**.
- Scopes: individual stock · monthly · yearly · all stocks / all time.
- CSV columns: Date, Stock, Invested Amount, Shares, Price / Share.
- XLSX: sheet 1 *Transactions* (same columns), sheet 2 *Summary* (total invested, total shares,
  average cost, transaction count).
- Every export is restricted to the authenticated user's own data.

## 11. Mobile Direction

Build **mobile-first**.

- Desktop: sidebar + main content.
- Mobile: top header + content + bottom mobile navigation.
- Desktop tables are **not** simply shrunk; mobile uses purpose-built cards, stacked forms and
  touch-sized controls.
- A future React Native / Expo client is anticipated, which is why calculation and shared types
  live in framework-agnostic packages. **No native mobile app is built in V1.**

## 12. Engineering Principles

1. **Derived, not stored.** Portfolio numbers are computed from transactions on demand.
2. **Decimal-safe money.** Authoritative financial math never relies on raw float arithmetic.
   Division by zero is handled explicitly and never produces `NaN` or `Infinity`.
3. **Pure core, thin edges.** Calculation and types are pure and portable; React and Supabase
   are edges.
4. **Degrade, do not crash.** Missing or stale market data downgrades the display, never breaks
   the page.
5. **Honest UI.** Stale means stale, mock means mock, unknown means unknown.
6. **Test the money first.** Financial calculations are the highest-priority test surface.
7. **Evidence over assertion.** A phase is complete when tests, typecheck, lint and build have
   actually been run and passed.
8. **Small, logical commits.**
9. **Scope discipline.** Useful-looking features outside V1 stop and ask.
10. **Accessibility basics.** Profit/loss is conveyed by sign and text, not by colour alone.
