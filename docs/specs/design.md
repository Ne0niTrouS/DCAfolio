# DCAfolio — Product & Technical Design (V1)

Status: authoritative design spec for V1.
Related: [`../../CLAUDE.md`](../../CLAUDE.md) · [`../../context.md`](../../context.md) ·
[`../plans/implementation-plan.md`](../plans/implementation-plan.md)

---

## 1. Architecture

### 1.1 System overview

```
┌───────────────────────────────────────────────────────────┐
│  Browser — React + TypeScript + Vite + Tailwind           │
│                                                           │
│  UI pages ── hooks/queries ── packages/calculation (pure) │
│      │                          packages/shared  (pure)   │
└──────┼────────────────────────────────────────────────────┘
       │ @supabase/supabase-js (anon key, user JWT)
       ▼
┌───────────────────────────────────────────────────────────┐
│  Supabase                                                 │
│   Auth (email/password)                                   │
│   PostgreSQL + Row Level Security  ← authorization edge   │
│   Edge Function: market-data (service role, API secrets)  │
└──────┬────────────────────────────────────────────────────┘
       │ HTTPS
       ▼
   External market-data provider (free) / MockProvider
```

The platform is **Supabase-first**: **there is no always-running Node/Express CRUD backend in
V1.** Authenticated CRUD goes straight from the browser to Supabase; RLS is the security
boundary. Only work that genuinely needs a server — calling an external market API with a secret
and writing the price cache — lives in an Edge Function.

### 1.2 Repository layout

```
DCAfolio/
├── CLAUDE.md
├── context.md
├── README.md
├── package.json                 # npm workspaces root
├── .env.example
│
├── apps/
│   └── web/                     # React + Vite application
│       ├── index.html
│       ├── vite.config.ts
│       ├── vitest.setup.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── lib/             # supabase client, market-data client, formatters
│           ├── features/
│           │   ├── auth/
│           │   ├── transactions/
│           │   ├── portfolio/
│           │   ├── market-data/
│           │   └── export/
│           ├── components/      # shared UI primitives + states
│           ├── layouts/         # AppShell, Sidebar, MobileNav
│           └── pages/           # Login, Dashboard, History, StockDetail, Export
│
├── packages/
│   ├── calculation/             # pure decimal-safe financial math
│   └── shared/                  # types, constants, formatters, validation
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   └── market-data/
│   └── tests/
│
└── docs/
    ├── specs/design.md
    └── plans/implementation-plan.md
```

### 1.3 Dependency rules

- `apps/web` may import `packages/*`. `packages/*` must never import `apps/web`.
- `packages/calculation` and `packages/shared` contain **no React, no Supabase, no I/O**.
- `packages/calculation` may depend on `packages/shared` (types only).
- A future REST API or React Native client reuses both packages unchanged.

### 1.4 Data flow

1. React page mounts → auth session resolved.
2. Data layer fetches `transactions` (joined with `stocks`) and `market_prices` from Supabase.
   RLS restricts transactions to `auth.uid()`.
3. Rows are mapped to plain domain objects (`packages/shared` types).
4. `packages/calculation` aggregates positions and portfolio totals — pure, synchronous.
5. React renders. Market data absence/staleness degrades the display, never breaks it.

### 1.5 State management

- Server state: **TanStack Query** (`@tanstack/react-query`) — caching, invalidation after
  mutations, loading/error states out of the box. Free, open source.
- Auth session: a single React context (`AuthProvider`) fed by
  `supabase.auth.onAuthStateChange`.
- Local UI state: component state. No global store in V1.

---

## 2. Authentication

### 2.1 Mechanism

Supabase Auth, **email + password only**. No OAuth providers, no magic links, no phone auth in
V1. Sessions persist in `localStorage` via the Supabase client (`persistSession: true`,
`autoRefreshToken: true`).

### 2.2 States

| State | Behaviour |
| --- | --- |
| `loading` | Full-page auth spinner. No page content, no redirect flash. |
| `authenticated` | App shell rendered, routes accessible. |
| `unauthenticated` | Redirect to `/login`, preserving the intended path. |
| `error` | Inline error message on the auth form; no silent failure. |

### 2.3 Routes

| Path | Guard | Page |
| --- | --- | --- |
| `/login` | public (redirects to `/` if already signed in) | Login |
| `/forgot-password` | public | Request reset email |
| `/reset-password` | recovery link | Set new password |
| `/` | protected | Dashboard |
| `/history` | protected | Transaction history |
| `/stocks/:symbol` | protected | Stock detail |
| `/export` | protected | Export |

`ProtectedRoute` renders the auth-loading state until the session is resolved, then either the
child route or a redirect to `/login`.

### 2.4 Login screen

A dark glass card centred on the near-black brand surface, with the language selector above it.

```
                                     [ ไทย ▾ ]
  ┌────────────────────────────────────────────┐
  │                   ( ↗ )                    │
  │                 DCAfolio                   │
  │          ติดตามพอร์ตหุ้นส่วนตัว                  │
  │                                            │
  │   ✉  [ อีเมล                          ]     │
  │   🔒 [ รหัสผ่าน                        ]     │
  │                                            │
  │           [      เข้าสู่ระบบ      ]           │
  └────────────────────────────────────────────┘

                © NeOniTrouS
```

The mark is a rising trend line inside a ring; "DCA" is white and "folio" green, but the
accessible name stays the single word. The field labels are present and screen-reader only —
the placeholder carries the same words on screen.

Behind the card sit two soft glows, two large rounded panels, two thin diagonal streaks and a
faint dotted grid. All of it is `aria-hidden` and `pointer-events-none`; it exists to give the
card somewhere to sit.

The card carries nothing else: no social sign-in, no registration link, no marketing copy, and
no forgot-password link. `/forgot-password` remains a working public route, reachable directly
and from the link in a reset email, but the signed-out UI does not advertise it.

Validation: email format, password required. Errors from Supabase are surfaced as a single
human-readable message (never a raw error object). The submit button shows a pending state and
is disabled while the request is in flight.

### 2.5 Forgot password

`supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/reset-password })`.
The confirmation message is deliberately neutral ("If an account exists for that address, a reset
link has been sent") so the form does not disclose which addresses are registered.

### 2.6 Profile bootstrap

On first successful sign-in, a `profiles` row is ensured for `auth.uid()` (idempotent upsert
from the client, permitted by RLS `WITH CHECK (user_id = auth.uid())`).

---

## 3. Database

PostgreSQL on Supabase. All schema changes go through files in `supabase/migrations/`.
**The production schema is never edited by hand.**

### 3.1 `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` NOT NULL UNIQUE | FK → `auth.users(id)` ON DELETE CASCADE |
| `display_name` | `text` | nullable |
| `created_at` | `timestamptz` NOT NULL | `default now()` |
| `updated_at` | `timestamptz` NOT NULL | `default now()`, maintained by trigger |

### 3.2 `stocks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `symbol` | `text` NOT NULL UNIQUE | uppercase, `CHECK (symbol = upper(symbol))` |
| `name_th` | `text` NOT NULL | Thai company name |
| `market` | `text` NOT NULL | `default 'SET'`, `CHECK (market = 'SET')` in V1 |
| `is_active` | `boolean` NOT NULL | `default true` |
| `created_at` | `timestamptz` NOT NULL | `default now()` |

The `market` CHECK is the V1 guard that keeps the product Thai-SET-only. Widening it is a
scope change requiring approval.

### 3.3 `transactions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE, `default auth.uid()` |
| `stock_id` | `uuid` NOT NULL | FK → `stocks(id)` ON DELETE RESTRICT |
| `purchase_date` | `date` NOT NULL | `CHECK (purchase_date <= current_date)` |
| `invested_amount` | `numeric(18,2)` NOT NULL | `CHECK (invested_amount > 0)` |
| `shares` | `numeric(18,4)` NOT NULL | `CHECK (shares > 0)` |
| `created_at` | `timestamptz` NOT NULL | `default now()` |
| `updated_at` | `timestamptz` NOT NULL | `default now()`, trigger-maintained |

`numeric` (not `float8`) is mandatory for money. There is **no stored price-per-share column** —
it is always derived, so it can never disagree with the amount and share count.

### 3.4 `market_prices`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `stock_id` | `uuid` NOT NULL | FK → `stocks(id)` ON DELETE CASCADE |
| `price` | `numeric(18,4)` NOT NULL | `CHECK (price > 0)` |
| `provider` | `text` NOT NULL | e.g. `mock`, or a verified free provider id |
| `captured_at` | `timestamptz` NOT NULL | `default now()` |
| `is_stale` | `boolean` NOT NULL | `default false` |

One row per successful capture (append-only history). The current price of a stock is the row
with the greatest `captured_at`, exposed through the view `latest_market_prices`.

`is_stale` is written `true` when a capture is known to be a re-publication of an older value.
The UI additionally treats any price older than `MARKET_PRICE_STALE_AFTER_MINUTES` (default 30)
as stale at read time, so staleness is correct even if nothing has written recently.

### 3.5 Indexes

```sql
create index transactions_user_date_idx  on transactions (user_id, purchase_date desc);
create index transactions_user_stock_idx on transactions (user_id, stock_id);
create index market_prices_stock_time_idx on market_prices (stock_id, captured_at desc);
```

`stocks.symbol` needs no explicit index — its `UNIQUE` constraint already creates one.

### 3.6 Triggers

`set_updated_at()` — `BEFORE UPDATE` on `profiles` and `transactions`, sets
`updated_at = now()`.

### 3.7 Stock master

Migration `0004_seed_stocks.sql` loads a starter set of well-known SET symbols (CPALL, PTT, AOT, ADVANC,
KBANK, SCB, BBL, PTTEP, CPN, BDMS, …) with Thai names, `market = 'SET'`, `is_active = true`.
Seeding is idempotent (`on conflict (symbol) do nothing`). The list is a convenience, not an
exhaustive SET listing; more symbols are added by migration.

---

## 4. Transaction Model

### 4.1 Domain object

```ts
type Transaction = {
  id: string;
  userId: string;
  stockId: string;
  purchaseDate: string;      // ISO 'YYYY-MM-DD'
  investedAmount: string;    // decimal string, THB
  shares: string;            // decimal string
  createdAt: string;
  updatedAt: string;
};
```

Money and share quantities cross the wire and live in memory as **decimal strings**, not
`number`, so no precision is lost between PostgreSQL `numeric` and JavaScript.

### 4.2 Derived value

```
pricePerShare = investedAmount / shares      (shares > 0, else null)
```

Never entered by the user, never stored.

### 4.3 Validation (shared by client and DB constraints)

| Rule | Message |
| --- | --- |
| purchase date required, not in the future | "Purchase date cannot be in the future." |
| stock required and active | "Select a stock." |
| invested amount > 0, ≤ 2 decimals | "Invested amount must be greater than 0." |
| shares > 0, ≤ 4 decimals | "Shares must be greater than 0." |

### 4.4 Mutations

- **Create** — insert with `user_id = auth.uid()`; the client never sends a `user_id` it chose.
- **Update** — editable fields: date, stock, invested amount, shares.
- **Delete** — hard delete, behind a confirmation dialog.

Every mutation invalidates the transaction and portfolio queries, so all derived figures
recompute. There are no stored aggregates to repair.

---

## 5. Portfolio Calculations

Implemented in `packages/calculation`. Pure, synchronous, no I/O, decimal-safe
(backed by `decimal.js`). Public API returns decimal strings for money and `number | null` for
percentages.

### 5.1 Formulas

| Quantity | Formula |
| --- | --- |
| Total Invested | `SUM(invested_amount)` |
| Total Shares | `SUM(shares)` |
| Average Cost | `Total Invested / Total Shares` |
| Current Value | `Total Shares × Current Market Price` |
| Profit / Loss | `Current Value − Total Invested` |
| Return % | `Profit/Loss / Total Invested × 100` |
| Allocation % | `Position Current Value / Portfolio Current Value × 100` |
| DCA / month | `Total Invested / distinct calendar months containing a purchase` |

### 5.2 Edge-case contract

| Situation | Result |
| --- | --- |
| No transactions | totals `"0.00"`, shares `"0"`, `averageCost = null`, `returnPercent = null` |
| Total shares = 0 | `averageCost = null` (never divide by zero) |
| Total invested = 0 | `returnPercent = null`, `allocationPercent = null` |
| No market price for a stock | `currentPrice = null`, `currentValue = null`, `profitLoss = null`, `returnPercent = null`; the position still shows invested/shares/average cost |
| Stale market price | values computed **and flagged** `priceStatus = 'stale'` |
| Invalid/non-numeric input | throws `InvalidFinancialValueError` — never silently coerced |
| Negative amount or shares | rejected by validation and by DB CHECK constraints |

`NaN` and `Infinity` never escape the calculation package.

### 5.3 Portfolio-level behaviour

Portfolio `currentValue` sums only positions that have a usable price. If any position lacks a
price, the portfolio result carries `hasIncompletePricing = true`, and the UI labels the figure
as partial rather than presenting it as a complete valuation.

### 5.4 Public API (shape)

```ts
computePosition(input: PositionInput): Position;
computePortfolio(inputs: PositionInput[]): Portfolio;
pricePerShare(investedAmount: string, shares: string): string | null;
averageCost(totalInvested: string, totalShares: string): string | null;
returnPercent(profitLoss: string, totalInvested: string): number | null;
dcaPerMonth(transactions: Pick<Transaction,'purchaseDate'|'investedAmount'>[]): string | null;
```

### 5.5 Rounding

Internal arithmetic keeps full decimal precision. Rounding happens only at the boundary:
money → 2 dp (half-up), shares → 4 dp, percentages → 2 dp. Allocation percentages are **not**
force-normalised to sum to exactly 100; the displayed values are honest rounded values.

---

## 6. Dashboard

The most important screen. It must answer three questions at a glance: *how much have I
invested*, *what is it worth now*, *am I up or down*.

### 6.1 KPI cards

```
Portfolio Value      Total Invested      Profit/Loss        Return %       DCA/month
฿1,265,200           ฿1,250,000          +฿15,200           +1.22%         ฿25,000
```

Signs are always explicit (`+` / `−`). Colour is a secondary cue only; the sign and, where
useful, a "Profit"/"Loss" label carry the meaning for colour-blind readers and greyscale.

Each card carries an icon tile, an uppercase label and the figure. A note appears only when
there is something true to say — "some stocks have no price yet" under Portfolio Value.

### 6.2 Portfolio allocation & positions

A ring, then a list of positions sorted by current value (falling back to invested amount when
unpriced), then the total:

```
   ╭───────╮     CPALL              ฿4,375
  │  35%    │    70 shares          35.00%
  │ CPALL   │                +฿4,125  +5.20%
   ╰───────╯     PTT                ฿3,125
                 ...
                 ┌──────────────────────────┐
                 │ Total holdings   ฿12,500 │
                 │ 3 stocks         100.00% │
                 └──────────────────────────┘
```

Every percentage the ring encodes is printed beside it, and each row links to `/stocks/:symbol`.
See §11.2 for the chart rules.

### 6.3 Invested over time

A cumulative area chart of everything the user has put in, one point per day on which a purchase
happened. **Not** portfolio value — see §11.2 for why.

### 6.4 Recent transactions

The five most recent purchases as a table: date · ticker · amount · shares · price per share. The
symbol is a badge, because it is an identifier rather than prose. Links to `/history`.

### 6.5 Summary

Counts, not money: stocks held, shares held, purchases recorded. Deliberately no cash balance —
see §11.3.

### 6.6 Market status strip

Market status (`open` / `closed` / `unknown`), provider name, last-updated timestamp, and a
`Cached` / `Stale` badge when applicable. When the provider is the mock provider, the strip says
so explicitly.

### 6.7 States

- **Loading** — skeleton KPI cards and list rows.
- **Empty** — "No investments yet. Add your first stock purchase." + `[ Add Purchase ]`.
- **Error (data)** — inline error with a retry action; the shell stays usable.
- **Error (market data)** — the portfolio still renders using cached prices with a stale badge;
  if no cached price exists, price-dependent figures show `—` with an explanatory note.

---

## 7. Portfolio & Stock Detail

### 7.1 Positions

A position is the aggregate of all transactions for one stock: shares, total invested, average
cost, current price, current value, profit/loss, return %, allocation %, price status.

### 7.2 Stock detail page (`/stocks/:symbol`)

```
CPALL  ·  บริษัท ซีพี ออลล์ จำกัด (มหาชน)

Shares            1,250
Total Invested    ฿78,500
Average Cost      ฿62.80
Current Price     ฿65.25          (provider · updated 5 min ago)
Current Value     ฿81,562.50
Profit            +฿3,062.50
Return            +3.90%

Purchase history
Date         Invested     Shares    Price/Share    Actions
09/08/2026   ฿12,500      200       ฿62.50         Edit  Delete
```

Desktop shows the history as a table, mobile as cards. Empty state: "No purchases recorded for
this stock." Unknown symbol → not-found state with a link back to the dashboard.

---

## 8. History

`/history` — the full transaction log.

**Controls**: free-text search (symbol / Thai name), stock filter (dropdown of stocks the user
actually owns, plus "All stocks"), date filter (from / to).

**Desktop table columns**: Date · Stock · Invested Amount · Shares · Price/Share · Actions
(Edit, Delete). Sorted by purchase date descending.

**Mobile**: one card per transaction with the same fields stacked, and the actions as
touch-sized buttons. The desktop table is never merely shrunk.

**Add / Edit form** (dialog on desktop, full-screen sheet on mobile):

```
Purchase Date   [ 09/08/2026 ]
Stock           [ CPALL      ▾]
Invested Amount [ 12,500      ]
Shares Received [ 200         ]

Calculated:  ฿62.50 / share

[ Cancel ]  [ Save ]
```

The calculated price per share updates live as the user types and is read-only.

**Delete confirmation**:

```
Delete Transaction?

CPALL
09/08/2026
฿12,500
200 shares

This will recalculate the portfolio.

[ Cancel ]  [ Delete ]
```

**States**: loading skeleton rows · empty ("No transactions yet.") · no-results-for-filter
(distinct from empty, offers "Clear filters") · error with retry.

---

## 9. Market Data

### 9.1 Provider interface

```ts
export interface MarketDataProvider {
  readonly id: string;                                  // 'mock' | verified provider id
  getQuote(symbol: string): Promise<Quote | null>;
  getQuotes(symbols: string[]): Promise<Record<string, Quote | null>>;
  getMarketStatus(): Promise<MarketStatus>;             // 'open' | 'closed' | 'unknown'
}

export type Quote = {
  symbol: string;
  price: string;          // decimal string
  provider: string;
  capturedAt: string;     // ISO timestamp
};
```

The dashboard and `packages/calculation` depend on this interface only — never on a concrete
provider.

### 9.2 Provider selection

Configuration allows three slots: **free provider** (default), **free fallback**, and an
**optional official SET provider**. Selection is by environment configuration; the app resolves
a provider at startup through a single factory.

**Provider verification is mandatory before adopting any real provider**: Thai SET symbol
support · current availability · free-tier limits · API terms · personal-use compatibility ·
whether an API key is required. Nothing is assumed free. Unauthorized scraping is not permitted.

**Until a provider is verified, V1 ships `MockMarketDataProvider`**, which returns clearly
synthetic, deterministic values and is labelled as mock everywhere in the UI. Real prices are
never fabricated.

### 9.3 Refresh & caching path

```
Edge Function `market-data` (invoked on demand / by schedule)
   → provider.getQuotes(active symbols held by users)
   → success: insert into market_prices (is_stale = false)
   → failure: keep the last successful row; the read path marks it stale
```

The browser reads prices from `latest_market_prices`, never by calling the external provider
directly (keeps API secrets server-side and avoids CORS/rate-limit exposure).

### 9.4 Failure behaviour

```
Provider fails
   ↓
Use latest cached successful price
   ↓
Mark price as stale
   ↓
Show last updated time
   ↓
Dashboard stays functional
```

Cached data is never presented as real-time. If there is no cached price at all, price-dependent
figures render as `—` with a short explanation, and invested/shares/average cost still display.

### 9.5 UI requirements

Every place a market price is shown must be able to show: the price, the provider, the
last-updated time, and a stale/cached badge when applicable.

---

## 10. Export

`/export`.

```
Export Data

Stock    [ All Stocks ▾]
Period   [ Monthly    ▾]     (All time | Monthly | Yearly)
Year     [ 2026       ▾]
Month    [ August     ▾]     (shown only for Monthly)
Format   [ XLSX       ▾]     (CSV | XLSX)

[ Export ]
```

**Scopes**: individual stock · monthly · yearly · all stocks / all time. Stock and period filters
combine (e.g. CPALL + August 2026).

**CSV** — columns: `Date, Stock, Invested Amount, Shares, Price / Share`. UTF-8 **with BOM** so
Thai text and `฿` open correctly in Excel. Values are raw numbers (no thousands separators) so
the file re-imports cleanly.

**XLSX** — generated client-side with the open-source **`write-excel-file`** library (MIT).
The `xlsx` (SheetJS) package originally named here was rejected: its npm build is abandoned at
0.18.5 with two unfixed high-severity advisories (prototype pollution, ReDoS).
`write-excel-file` is maintained, browser-first and write-only, which is all this feature needs.

- *Sheet 1 — Transactions*: Date, Stock, Invested Amount, Shares, Price / Share.
- *Sheet 2 — Summary*: Total Invested, Total Shares, Average Cost, Transaction Count.

Money and share counts are written as numbers, not strings, so the workbook is usable for
arithmetic the moment it opens.

File naming: `dcafolio_<scope>_<range>.<ext>`, e.g. `dcafolio_CPALL_2026-08.xlsx`,
`dcafolio_all_all-time.csv`.

**Security**: exports are built from RLS-filtered queries, so they can only ever contain the
authenticated user's own data. An empty result set produces a friendly "No transactions match
this selection" message instead of an empty file.

---

## 11. Responsive UI

Mobile-first. Tailwind breakpoints; base styles target small screens, `md:`/`lg:` add desktop.

| Viewport | Layout |
| --- | --- |
| `< 768px` | dark top bar (page title · language · account menu) · content · fixed bottom navigation (Dashboard · History · Export) · floating "Add Purchase" action |
| `≥ 768px` | collapsible dark sidebar (brand · navigation · Add Purchase · Logout) · dark top bar · light main content |

The account menu carries Logout as well as the signed-in address: below `md` the sidebar is not
rendered, so the menu is the only way out.

Rules:

- Tables become cards on mobile, never horizontally squeezed grids.
- Forms stack to a single column; inputs are at least 44px tall.
- Numeric inputs use `inputMode="decimal"` for a usable mobile keypad.
- Dialogs become full-screen sheets on mobile.

**Design language**: a premium personal-investment surface — clean, minimal, modern, trustworthy;
personal finance, not a trading terminal. Near-black navigation, light content, white cards with
soft shadows, one green accent, generous spacing, tabular numerals for figures. Two charts and no
more, no decorative animation.

Design tokens live in `apps/web/src/index.css` under Tailwind's `@theme`:

| Role | Token | Value |
| --- | --- | --- |
| Accent / profit | `accent`, `accent-bright`, `accent-strong`, `accent-light`, `accent-subtle` | `#16A34A` · `#22C55E` · `#15803D` · `#DCFCE7` · `#F0FDF4` |
| Brand surfaces | `nav`, `nav-deep`, `nav-hover`, `nav-card`, `nav-active`, `nav-border` | `#0F141A` · `#090C11` · `#1B222C` · `#161B22` · `rgb(22 163 74 / .15)` · `rgb(255 255 255 / .08)` |
| Brand text | `nav-ink`, `nav-ink-muted` | `#E5E7EB` · `#94A3B8` |
| Content | `surface`, `surface-raised`, `surface-sunken`, `border-subtle` | `#F8FAFC` · `#FFFFFF` · `#F1F5F9` · `#E5E7EB` |
| Text | `ink`, `ink-muted`, `ink-faint` | `#111827` · `#64748B` · `#94A3B8` |
| Loss | `loss` | `#DC2626` |

Primary buttons are a top-to-bottom `accent-bright → accent` gradient. Inputs use a `#D1D5DB`
border on light and `nav-border` on dark, both with a green focus ring; the browser's default
focus styling is never relied on.

### 11.2 Charts

Two, both hand-drawn SVG — no charting library, so nothing joins the bundle and nothing phones
home.

| Chart | Component | Source |
| --- | --- | --- |
| Allocation ring | `features/portfolio/DonutChart.tsx` | `Position.allocationPercent` |
| Cumulative invested | `features/portfolio/InvestedChart.tsx` | `investedSeries()` over the user's transactions |

Rules that keep them honest:

- Every figure a chart encodes is also printed as text beside it. A chart is a summary, never the
  only way to read a number.
- The area chart plots **invested**, not portfolio value. A value curve needs a price for every
  past day and the cache holds only the latest one; drawing it from today's price would invent
  history.
- Ratios used for geometry are plain `number` — they are layout, not money. The amounts are summed
  with the decimal helpers and formatted from the decimal string.
- Ring colours are shades of the one accent and repeat after six holdings, which is acceptable
  precisely because the percentage is written next to each row.

### 11.3 Deliberate omissions

The dashboard mockup contains three things V1 does not render, because the data behind them does
not exist and inventing it would break §12's honesty rules:

| In the mockup | Why it is absent |
| --- | --- |
| Notification bell | Notifications are out of V1 scope (§3.2). A bell that never rings is a lie. |
| Cash Balance | DCAfolio records purchases, not a cash account. There is no balance to report. |
| Date-range picker and "vs all time" deltas | A portfolio position is all-time by definition; a date-filtered "portfolio value" would mislead. History already has date filters, where they mean something. |

Summary reports what is real instead: stocks held, shares held, purchases recorded.

**Font**: Inter for Latin, followed by Thai-capable faces (`Noto Sans Thai`, `IBM Plex Sans Thai`,
`Sarabun`, `Leelawadee UI`, `Tahoma`). Fallback is per glyph, so Latin stays on Inter while Thai
renders in a real Thai UI face. Nothing is fetched from a font CDN.

### 11.1 Language

Thai and English, switched from one selector — top-right of the signed-out card, and in the
navbar once signed in. The button shows the active language ("ไทย" / "English"), never a generic
caption; the menu offers exactly those two options and marks the current one.

| Layer | File | Responsibility |
| --- | --- | --- |
| Dictionaries | `i18n/en.ts`, `i18n/th.ts` | Every phrase. `TranslationKey` derives from `en`, and `th` is typed against it, so a gap is a compile error. |
| Translator | `i18n/translate.ts` | Lookup plus `{name}` substitution. |
| State | `i18n/LanguageProvider.tsx` | Holds the choice; resets on any authentication-status change. |
| Access | `i18n/use-language.ts` | `useLanguage()` / `useT()`. Without a provider it reports the default language rather than throwing. |
| Control | `components/LanguageSelector.tsx` | The one selector, used in both places. |

The choice is **never persisted**. That is what guarantees the required behaviour: login always
opens in Thai, a successful sign-in starts the application in Thai, English survives navigation
between pages and into open modals, and signing out returns login to Thai.

Only UI text is translated. Stock symbols, `name_th`, money and dates are data and never change
with the language.

**Accessibility**: semantic landmarks, labelled form controls, visible focus rings, WCAG AA
contrast, profit/loss conveyed by sign and text as well as colour, dialogs trap focus and close
on `Escape`.

---

## 12. Security

| Area | Rule |
| --- | --- |
| RLS | Enabled on `profiles`, `stocks`, `transactions`, `market_prices`. |
| `profiles` | SELECT/INSERT/UPDATE/DELETE restricted to `user_id = auth.uid()`. |
| `transactions` | SELECT/UPDATE/DELETE `USING (user_id = auth.uid())`; INSERT `WITH CHECK (user_id = auth.uid())`. |
| `stocks` | SELECT for role `authenticated`. No client write policy. |
| `market_prices` | SELECT for role `authenticated`. Writes only via the Edge Function's service role. |
| Identity | Always `auth.uid()`. A client-supplied `user_id` is never trusted. |
| Secrets | Service-role key, provider API keys and tokens live only in Edge Function secrets. Never in `VITE_*`, never in the bundle, never in git. |
| Env files | `.env` is git-ignored; only `.env.example` (no values) is committed. |
| Transport | HTTPS everywhere; Supabase enforces TLS. |
| Errors | Auth errors are surfaced as generic user-facing messages; raw provider errors are not rendered. |

Cross-user access is verified by an explicit test that authenticates as user B and confirms it
cannot read, update or delete user A's transactions.

---

## 13. Testing

**Runner**: Vitest. **Component tests**: React Testing Library + jsdom.

| Layer | Scope |
| --- | --- |
| `packages/calculation` | Unit, TDD-first, 100% of the public API. All §5.2 edge cases. |
| `packages/shared` | Formatters, validation rules. |
| Data access | Supabase client mocked at the boundary; query shape and mutation payloads asserted. |
| RLS | Integration tests against a local Supabase instance: user B cannot touch user A's rows. |
| Market data | Mock provider behaviour; failure → cached → stale path; missing price path. |
| Export | Filter correctness (stock/monthly/yearly/all), CSV column output, XLSX sheet structure and summary values, user-scoping. |
| UI | Login form, protected routes, dashboard render, add/edit/delete transaction flows, history search/filter, export dialog, and the loading / empty / error state of each major page. |

Required calculation cases: one transaction · multiple transactions · different purchase
prices · positive profit · negative loss · zero profit · zero shares · zero invested · invalid
values · missing price · stale price · state after edit · state after delete.

Gate before any phase is declared complete: `npm run typecheck`, `npm run lint`, `npm test`, and
`npm run build` where the phase touched `apps/web`. Real output is reported; created files alone
are never evidence of completion.

---

## 14. Deployment

| Component | Target | Tier |
| --- | --- | --- |
| Source | GitHub | Free |
| Web app | Cloudflare Pages | Free |
| Database / Auth / Functions | Supabase | Free |

**Cloudflare Pages** — build command `npm run build`, output directory `apps/web/dist`, Node 22.
A SPA fallback (`/* → /index.html`, 200) is required for client-side routing.
Environment variables set in the Pages dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Both are browser-public by design; no other variable is exposed to the client.

**Supabase** — migrations applied via the Supabase CLI (`supabase db push`); the Edge Function
deployed with `supabase functions deploy market-data`; provider secrets set with
`supabase secrets set`. The site URL and the password-reset redirect URL are configured in Auth
settings.

**Free-tier limitations to keep in mind**: Supabase free projects pause after a period of
inactivity and have storage/bandwidth caps; Cloudflare Pages free has a monthly build limit.
Both are comfortably sufficient for single-user personal usage. No paid service is introduced
without explicit approval.

**Production verification checklist**: login · add a purchase · dashboard figures correct ·
edit · delete · history filters · CSV export · XLSX export · market-status strip · mobile
layout · a second account cannot see the first account's data.

---

## 15. Future Expansion (not V1)

The architecture is prepared for, but V1 deliberately does not implement:

- **Sell transactions / realised P&L** — add a `type` column to `transactions` and extend the
  calculation package; the position aggregator is already the single place that would change.
- **Dividends, stock splits** — new tables plus new calculation inputs; the transaction model
  stays authoritative.
- **A real market-data provider** — drop-in implementation of `MarketDataProvider`; nothing
  else changes.
- **REST API / React Native (Expo) client** — reuses `packages/calculation` and
  `packages/shared` unchanged; Supabase Auth already issues portable JWTs.
- **Other markets / instruments** — the `market` CHECK constraint on `stocks` is the single
  intentional gate.

Each of these is a scope change requiring explicit approval before any work starts.
