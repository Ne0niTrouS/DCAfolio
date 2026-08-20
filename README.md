# DCAfolio

**Personal Stock Portfolio Tracker** · Thai SET stocks · V1 · by NeOniTrouS

DCAfolio records the stock purchases you actually made and works out everything else: how much
you have invested, how many shares you own, your average cost, what the portfolio is worth now,
and whether you are up or down.

You enter four things — date, stock, amount invested, shares received. The price per share is
derived, never typed. Recording a purchase takes under 30 seconds.

```
BUY STOCK → RECORD PURCHASE → CALCULATE COST → GET MARKET PRICE
          → CALCULATE CURRENT VALUE → CALCULATE PROFIT/LOSS → DASHBOARD
```

---

## Features

**Dashboard** — portfolio value, total invested, profit/loss, return %, DCA per month; an
allocation ring with a row per holding; a chart of what you have invested over time; recent
purchases; and a market-data strip that always names the provider and how old the price is.

Both charts are hand-drawn SVG — no charting library, nothing fetched at runtime. The area chart
plots **invested**, not portfolio value: a value curve would need a price for every past day, and
only the latest one is cached, so drawing it would invent history.

**Transactions** — add, edit and delete purchases. Live-derived price per share. Deleting asks
for confirmation and says the portfolio will be recalculated.

**History** — the full log, with search over symbol and Thai name, a stock filter and a date
range. A table on desktop, purpose-built cards on mobile.

**Stock detail** — shares, total invested, average cost, current price, current value,
profit/loss, return %, and the purchase history for one stock.

**Export** — CSV and XLSX, for one stock or all, by month, by year, or all time. XLSX carries a
Transactions sheet and a Summary sheet.

**Thai and English** — one selector, on the login card and in the navbar. It shows the language
you are in, not a generic caption. Thai is the default: login always opens in Thai and so does
the app right after you sign in. Switching to English lasts for the session and follows you
across pages and into dialogs; it is never stored, so login is Thai again next time.

**Honest numbers** — a missing price shows `—` rather than a zero. A cached price is labelled
cached. Mock data is labelled mock. Profit and loss always carry an explicit `+` or `−`, never
colour alone.

---

## Architecture

```
Browser — React + TypeScript + Vite + Tailwind
   │  @supabase/supabase-js (anon key, user JWT)
   ▼
Supabase — Auth · PostgreSQL + Row Level Security · Edge Function (market-data)
   │
   ▼
Market-data provider (mock in V1)
```

**Supabase-first.** There is no always-running Node/Express backend. The React app talks to
PostgreSQL directly and **Row Level Security is the authorization boundary**. Only work that
genuinely needs a server — calling an external market API with a secret and writing the price
cache — lives in an Edge Function.

```
apps/web/              React application
packages/calculation/  pure decimal-safe financial math — no React, no Supabase, no I/O
packages/shared/       types, constants, formatters, validation — locale-free
apps/web/src/i18n/     Thai and English dictionaries, language state, translator
supabase/              migrations, seed, Edge Functions, database tests
docs/                  design, plans, provider evaluation, security review
```

Business logic lives outside React, so a future REST API or React Native client can reuse it
unchanged.

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4 |
| Server state | TanStack Query 5 |
| Routing | React Router 7 |
| Backend | Supabase (Auth, PostgreSQL, RLS, Edge Functions) |
| Money math | decimal.js |
| Export | write-excel-file (XLSX), hand-built CSV |
| Tests | Vitest 4, React Testing Library, PGlite for database tests |
| Hosting | Cloudflare Pages |

TypeScript is pinned to 5.9 because `typescript-eslint` does not yet support 6+.

---

## Local setup

```bash
npm install
cp .env.example .env    # then fill in the two Supabase values
npm run dev             # http://localhost:5173
```

`.env` belongs at the repository root, next to `.env.example` — `vite.config.ts` points
`envDir` there.

The app **fails loudly at startup** if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is
missing, rather than silently producing a client that 401s on every request.

### Scripts

```bash
npm run dev            # Vite dev server
npm run build          # production build → apps/web/dist
npm run typecheck      # tsc across every workspace
npm run lint           # ESLint
npm test               # every test project
npm run test:coverage  # with a coverage report
npm run verify         # typecheck + lint + test + build
npm run db:test        # schema, constraint and RLS tests only
```

---

## Supabase setup

Full instructions, including account creation and production verification, are in
[`docs/plans/deployment-runbook.md`](docs/plans/deployment-runbook.md). In short:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**There is no sign-up screen.** DCAfolio is a single-owner personal app, so
`supabase/config.toml` disables sign-up and you create your account from the Supabase dashboard
(*Authentication → Users → Add user*, with *Auto Confirm User* ticked).

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser | Supabase project URL — public by design |
| `VITE_SUPABASE_ANON_KEY` | browser | Anon key — public by design; grants nothing on its own, because RLS decides access |
| `VITE_MARKET_DATA_PROVIDER` | browser | Provider id; `mock` in V1 |
| `MARKET_DATA_PROVIDER` | Edge Function secret | Server-side provider id |

**Never put a server secret in a `VITE_` variable** — anything with that prefix is compiled into
the public bundle. The `service_role` key belongs only in Supabase Edge Function secrets. `.env`
is git-ignored; only `.env.example` is committed, and it holds no values.

### Database migrations

Every schema change is a file in `supabase/migrations/`, applied with `supabase db push`.
**The production schema is never edited by hand.** To undo something, write a new migration.

| Table | Purpose |
| --- | --- |
| `profiles` | one row per user |
| `stocks` | Thai SET stock master (shared, read-only for clients) |
| `transactions` | **the source of truth** — every derived figure comes from here |
| `market_prices` | append-only cache of successful price captures |

Money uses `numeric`, never floating point. Price per share is deliberately **not stored**: it is
always `invested_amount / shares`, so the two can never disagree.

### Row Level Security

RLS is enabled on all four tables and covers SELECT, INSERT, UPDATE and DELETE. You can only ever
see your own profile and your own transactions. Identity always comes from `auth.uid()` — a
client-supplied `user_id` is never trusted, and the insert payload does not contain one. The
stock master and the price cache are readable by any signed-in user and writable only
server-side.

This is verified by tests: `supabase/tests/rls.test.ts` applies the real migrations to an
in-process Postgres and proves that a second user cannot read, update, delete, or forge
ownership of another user's rows. See
[`docs/specs/security-review.md`](docs/specs/security-review.md).

---

## Market data

> **V1 ships a mock provider. The prices are not real.**

Market data sits behind a `MarketDataProvider` interface (`getQuote`, `getQuotes`,
`getMarketStatus`); the dashboard and the calculation engine never depend on a concrete source.

No free provider of Thai SET quotes could be verified against the project's criteria — Twelve
Data's free tier covers three exchanges and is US-focused, Finnhub puts international data behind
a paid plan, Alpha Vantage documents no Thailand suffix, Marketstack offers 100 end-of-day
requests a month with unconfirmed Thai coverage, Yahoo Finance has no authorised free API, and
the SET's own free API is an ESG dataset rather than a quote feed. The evidence is recorded in
[`docs/specs/market-data-providers.md`](docs/specs/market-data-providers.md).

So `MockMarketDataProvider` is the documented default. It derives a deterministic, obviously
synthetic price from the symbol, reports market status as `unknown` rather than guessing, and is
labelled *"Mock data — not real prices"* everywhere it appears. **No real stock price is
fabricated.** Total invested, share counts and average cost are always real — they come from your
own transactions.

Adding a verified provider later means writing one class and registering it in
`apps/web/src/features/market-data/provider.ts`. Nothing else changes.

When a provider fails, the Edge Function re-publishes the last successful price marked stale; the
dashboard keeps working and says the number is cached. A price older than 30 minutes is treated
as stale at read time, so a stopped refresh job cannot make an old price look current.

---

## Language

Thai and English, held in `apps/web/src/i18n`. Components never contain a literal string — every
label goes through `t()`.

Adding a phrase: put it in `en.ts` first (the key type is derived from that file), then in
`th.ts`, which the typecheck will demand. Use `{name}` for anything interpolated.

The active language is **not persisted**. That is deliberate rather than an oversight: it is what
makes login always open in Thai, no matter what was chosen last time. Crossing the sign-in
boundary in either direction resets to Thai.

Only UI text is translated. Stock symbols, Thai company names, money and dates are data, so a
language change never rewrites them. `packages/shared` and `packages/calculation` stay locale-free
and return codes rather than sentences.

---

## Testing

```bash
npm test
```

292 tests across four projects. Financial calculations are the highest priority:
`packages/calculation` is developed test-first and sits at 100% of statements, lines and
functions, covering one transaction, many at different prices, positive profit, negative loss,
exactly zero, zero shares, zero invested, invalid values, missing prices, stale prices, and the
state after an edit or a delete.

Database tests apply the real migration files to an in-process Postgres (PGlite) behind a minimal
Supabase shim, so RLS policies execute the way they do in production — no Docker needed.

Overall coverage: 93.7% statements, 95.1% lines.

---

## Build

```bash
npm run build     # → apps/web/dist
```

The signed-in pages and the XLSX writer load on demand, so arriving at the login screen does not
download the whole application.

## Export

CSV columns: `Date, Stock, Invested Amount, Shares, Price / Share`. The file starts with a UTF-8
byte-order mark so Thai company names open correctly in Excel, and values are raw numbers so the
file re-imports cleanly.

XLSX has two sheets — *Transactions* (the same columns) and *Summary* (total invested, total
shares, average cost, transaction count) — with money written as numbers, not text.

Exports are built from the RLS-filtered query, so they can only ever contain your own data.

## Deployment

GitHub → Cloudflare Pages → Supabase, all on free tiers. Follow
[`docs/plans/deployment-runbook.md`](docs/plans/deployment-runbook.md), which covers the build
settings, the SPA fallback, the auth redirect URLs and a 17-point production verification list.

### Free-tier limitations

- **Supabase Free** pauses a project after about a week of inactivity; you resume it from the
  dashboard. 500 MB database, 5 GB egress — far beyond one person's needs.
- **Cloudflare Pages Free** allows 500 builds a month, one per push.
- Nothing in V1 requires a paid plan. A custom domain, a paid market-data feed or a Supabase paid
  tier are optional later decisions.

---

## Roadmap

Deliberately **not** in V1, but the architecture is ready for each:

- A verified real market-data provider — one class, registered in one place.
- Sell transactions and realised profit/loss — a `type` column plus changes confined to the
  position aggregator.
- Dividends and stock splits.
- A React Native / Expo client, reusing `packages/calculation` and `packages/shared` unchanged.
- Other markets — the `market = 'SET'` CHECK constraint on `stocks` is the single intentional
  gate.

Each is a scope change requiring explicit approval before any work starts. See
[`context.md`](context.md) §4.

---

## Documentation

| Document | What it is |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Operating rules for anyone (or any agent) working in this repository |
| [`context.md`](context.md) | Why DCAfolio exists, the locked V1 scope, the principles |
| [`docs/specs/design.md`](docs/specs/design.md) | Product and technical design |
| [`docs/specs/market-data-providers.md`](docs/specs/market-data-providers.md) | Provider evaluation and the decision to ship a mock |
| [`docs/specs/security-review.md`](docs/specs/security-review.md) | RLS, secrets and dependency review |
| [`docs/plans/implementation-plan.md`](docs/plans/implementation-plan.md) | The twelve phases and what each one verified |
| [`docs/plans/deployment-runbook.md`](docs/plans/deployment-runbook.md) | Step-by-step deployment |

---

© NeOniTrouS
