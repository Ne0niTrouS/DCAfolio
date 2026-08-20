# DCAfolio — Implementation Plan (V1)

Related: [`../../CLAUDE.md`](../../CLAUDE.md) · [`../../context.md`](../../context.md) ·
[`../specs/design.md`](../specs/design.md)

Phases are dependency-ordered. Work one phase at a time: inspect → implement → test → typecheck
→ lint → build (where relevant) → review → commit. Never implement several phases in one giant
operation.

**Universal verification gate** (every phase):

```bash
npm run typecheck
npm run lint
npm test
npm run build     # when the phase touched apps/web
```

## Progress

| Phase | Title | Status |
| --- | --- | --- |
| 0 | Documentation | ✅ Complete |
| 1 | Project Foundation | ✅ Complete |
| 2 | Supabase Foundation | ✅ Complete (schema verified in PGlite; not yet applied to a real project) |
| 3 | Authentication | ✅ Complete (unverified against a live Supabase project) |
| 4 | Calculation Engine | ⬜ Not started |
| 5 | Transaction Management | ⬜ Not started |
| 6 | Dashboard | ⬜ Not started |
| 7 | Market Data | ⬜ Not started |
| 8 | History | ⬜ Not started |
| 9 | Export | ⬜ Not started |
| 10 | Responsive Polish | ⬜ Not started |
| 11 | Quality | ⬜ Not started |
| 12 | Deployment | ⬜ Not started |

---

## PHASE 1 — Project Foundation

**Objective**: a working Supabase-first npm-workspaces monorepo with React + TypeScript + Vite +
Tailwind, lint, format, test runner, git configuration and environment configuration — verified
by a passing typecheck, lint, test and production build.

**Outcome (verified 2026-08-20)**: Node 22.16.0 / npm 11.4.2. Vite 8.2.1, React 19.2.8,
Tailwind 4.3.3 (CSS-first, so no `tailwind.config.js`), TypeScript 5.9.3 (pinned below 6 for
`typescript-eslint` compatibility), ESLint 10.8.1, Vitest 4.1.11. 16 tests across 3 projects.
Typecheck ✅ · lint ✅ · test ✅ · build ✅.

### Task 1.1 — Inspect repository
- **Files**: none.
- **Details**: confirm the working directory, list existing files, decide whether anything must be
  preserved. Do not delete unrelated files.
- **Verification**: the structure is reported before any file is written.
- **Expected**: a documented starting state.

### Task 1.2 — Root workspace
- **Files**: `package.json`, `.gitignore`, `.npmrc`, `tsconfig.base.json`, `.editorconfig`.
- **Details**: npm workspaces `apps/*`, `packages/*`. Root scripts `dev`, `build`, `test`,
  `typecheck`, `lint`, `format`. `tsconfig.base.json` sets `strict: true`, `ES2022`,
  `moduleResolution: bundler`, `noUncheckedIndexedAccess`.
- **Tests**: none (configuration).
- **Verification**: `npm install` completes; `npm run typecheck` resolves all workspaces.
- **Expected**: installable monorepo.

### Task 1.3 — Shared and calculation package skeletons
- **Files**: `packages/shared/{package.json,tsconfig.json,src/index.ts}`,
  `packages/calculation/{package.json,tsconfig.json,src/index.ts}`.
- **Details**: `@dcafolio/shared` (types, constants, formatters), `@dcafolio/calculation`
  (depends on `shared` + `decimal.js`). No React, no Supabase, no I/O.
- **Tests**: one smoke test per package proving the runner works.
- **Verification**: `npm test` runs both packages.
- **Expected**: importable packages.

### Task 1.4 — Web app (Vite + React + TS + Tailwind)
- **Files**: `apps/web/{package.json,tsconfig.json,vite.config.ts,index.html}`,
  `apps/web/src/{main.tsx,App.tsx,index.css}`.
- **Details**: Vite React-TS. Tailwind with a minimal finance-appropriate theme and tabular
  numerals. Path alias `@/` → `apps/web/src`. Workspace packages consumed as source via alias so
  no pre-build step is needed.
- **Tests**: a render smoke test (Vitest + RTL + jsdom).
- **Verification**: `npm run dev` serves; `npm run build` emits `apps/web/dist`.
- **Expected**: an app shell that builds.

### Task 1.5 — Lint, format, test config
- **Files**: `eslint.config.js`, `.prettierrc`, `vitest.config.ts`,
  `apps/web/vitest.setup.ts`.
- **Details**: ESLint flat config (TypeScript + React Hooks + React Refresh, plus a
  `no-restricted-imports` purity guard keeping `packages/*` free of React, Supabase and `node:`
  imports), Prettier, and Vitest projects covering all three workspaces with jsdom + RTL for the
  web app.
- **Verification**: `npm run lint` and `npm test` pass.
- **Expected**: enforced standards.

### Task 1.6 — Environment & git configuration
- **Files**: `.env.example`, `.gitignore`, `README.md` (initial).
- **Details**: `.env.example` contains only `VITE_SUPABASE_URL=` and `VITE_SUPABASE_ANON_KEY=`.
  `.gitignore` covers `node_modules`, `dist`, `.env*` (except `.env.example`), coverage, editor
  files. Git repo initialised on `main`.
- **Verification**: `git status` shows no `.env` or `node_modules`.
- **Expected**: no secret can be committed accidentally.

**Phase tests**: package smoke tests + web render smoke test.
**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: `npm run dev` shows a DCAfolio shell; all gates green.
**Commits**: `chore: initialize npm workspaces monorepo` · `feat: initialize dcafolio web app` ·
`chore: add lint, format and test configuration`.

---

## PHASE 2 — Supabase Foundation

**Objective**: complete database schema, constraints, indexes, RLS policies and SET stock seed,
expressed entirely as migrations.

**Outcome (verified 2026-08-20)**: 27 database tests pass. Docker is not installed on the
development machine, so `supabase start` cannot run; instead the real migration files are applied
to an in-process Postgres (**PGlite**) behind a minimal Supabase shim (`auth` schema,
`auth.users`, an `auth.uid()` backed by a session setting, and the `anon` / `authenticated` /
`service_role` roles), so RLS policies execute exactly as they do in production.
**Still unverified**: application against a real Supabase project (`supabase db push`) — that
needs a Supabase account and happens in Phase 12.

### Task 2.1 — Supabase project configuration
- **Files**: `supabase/config.toml`, `.env.example` (unchanged keys), README setup section.
- **Details**: local Supabase CLI configuration; document `supabase start` / `supabase db reset`.
- **Verification**: `supabase start` runs locally (documented if the CLI is unavailable).

### Task 2.2 — Core tables migration
- **Files**: `supabase/migrations/0001_init.sql`.
- **Details**: `profiles`, `stocks`, `transactions`, `market_prices` exactly as
  `design.md` §3, with `numeric` money columns, FKs, CHECK constraints, `set_updated_at()`
  trigger, and the `latest_market_prices` view.
- **Tests**: applying the migration to a clean database succeeds; constraint tests reject
  `invested_amount <= 0`, `shares <= 0`, a future `purchase_date`, and `market <> 'SET'`.
- **Verification**: `supabase db reset` applies cleanly.

### Task 2.3 — Indexes
- **Files**: `supabase/migrations/0002_indexes.sql`.
- **Details**: the four indexes in `design.md` §3.5.
- **Verification**: `explain` on the dashboard query uses the user/date index.

### Task 2.4 — Row Level Security
- **Files**: `supabase/migrations/0003_rls.sql`.
- **Details**: enable RLS on all four tables; per-command policies as `design.md` §12;
  `stocks` and `market_prices` readable by `authenticated`, with no client write policy.
- **Tests**: RLS integration test — user B cannot SELECT/UPDATE/DELETE user A's transactions and
  cannot INSERT a row with another user's `user_id`.
- **Verification**: the test suite passes against a local Supabase instance.

### Task 2.5 — Stock seed
- **Files**: `supabase/seed/stocks.sql`.
- **Details**: starter SET symbols with Thai names, idempotent `on conflict (symbol) do nothing`.
- **Verification**: seeding twice produces no duplicates.

**Phase verification**: migrations apply cleanly · constraint tests pass · RLS tests pass ·
typecheck/lint/test green.
**Expected result**: a secure, seeded schema reproducible from zero.
**Commits**: `feat: add supabase schema` · `feat: add row level security policies` ·
`feat: seed thai set stock master`.

---

## PHASE 3 — Authentication

**Objective**: working email/password auth with session persistence and protected routes.

**Outcome (verified 2026-08-20)**: 34 web tests pass, covering provider state transitions,
profile bootstrap, every auth operation, error mapping, both auth forms and route protection for
all four protected routes. The Supabase client is mocked at the module boundary.
**Still unverified**: a real sign-in against a live Supabase project, and delivery of the
password-reset email — both need a provisioned project (Phase 12).

### Task 3.1 — Supabase client & auth provider
- **Files**: `apps/web/src/lib/supabase.ts`, `apps/web/src/features/auth/AuthProvider.tsx`,
  `apps/web/src/features/auth/use-auth.ts`.
- **Details**: single client with `persistSession` and `autoRefreshToken`; context exposing
  `session`, `user`, `status` (`loading` | `authenticated` | `unauthenticated`), `signIn`,
  `signOut`, `requestPasswordReset`, `updatePassword`. Missing env vars fail loudly at startup.
- **Tests**: provider transitions across auth state changes (client mocked).

### Task 3.2 — Login page
- **Files**: `apps/web/src/pages/LoginPage.tsx`, `apps/web/src/components/*`.
- **Details**: the layout in `design.md` §2.4 including the `© NeOniTrouS` credit. Validation,
  pending state, single human-readable error message.
- **Tests**: renders fields · rejects an invalid email · calls `signIn` · shows an error on
  failure · disables submit while pending.

### Task 3.3 — Forgot Password / reset password
- **Files**: `apps/web/src/pages/ForgotPasswordPage.tsx`,
  `apps/web/src/pages/ResetPasswordPage.tsx`.
- **Details**: `resetPasswordForEmail` with a `redirectTo` of `/reset-password`; neutral
  confirmation copy that does not disclose account existence.
- **Tests**: submits the request · shows the neutral confirmation · reset form updates the
  password.

### Task 3.4 — Routing, protected routes, app shell, logout
- **Files**: `apps/web/src/App.tsx`, `apps/web/src/features/auth/ProtectedRoute.tsx`,
  `apps/web/src/layouts/AppShell.tsx`.
- **Details**: React Router routes per `design.md` §2.3; auth-loading state with no redirect
  flash; intended-path preservation; logout in the account menu; profile row ensured on first
  sign-in.
- **Tests**: unauthenticated access to `/` redirects to `/login` · authenticated access renders
  the dashboard shell · logout returns to `/login`.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: sign in, stay signed in across reloads, sign out, request a reset.
**Commit**: `feat: add authentication`.

---

## PHASE 4 — Calculation Engine

**Objective**: a decimal-safe, framework-independent calculation package developed test-first.

### Task 4.1 — Decimal foundation
- **Files**: `packages/calculation/src/decimal.ts`, `packages/calculation/src/errors.ts`.
- **Details**: thin `decimal.js` wrapper; parse/validate helpers; `InvalidFinancialValueError`;
  `safeDivide` returning `null` for a zero/invalid denominator; rounding helpers (money 2 dp,
  shares 4 dp, percent 2 dp, half-up).
- **Tests (written first)**: rejects `NaN`, `Infinity`, `''`, `'abc'`, `null`, negative where
  disallowed; `safeDivide(x, 0) === null`; rounding boundaries.

### Task 4.2 — Primitive calculations
- **Files**: `packages/calculation/src/primitives.ts`.
- **Details**: `pricePerShare`, `averageCost`, `returnPercent`, `profitLoss`, `currentValue`,
  `allocationPercent`.
- **Tests**: `12500 / 200 = 62.50`; zero shares → `null`; zero invested → `null`;
  positive / negative / exactly-zero profit.

### Task 4.3 — Position & portfolio aggregation
- **Files**: `packages/calculation/src/position.ts`, `packages/calculation/src/portfolio.ts`,
  `packages/calculation/src/index.ts`.
- **Details**: `computePosition`, `computePortfolio` per `design.md` §5, including
  `priceStatus` and `hasIncompletePricing`.
- **Tests**: one transaction · many transactions at different prices · a stock with no price ·
  a stale price · mixed priced/unpriced portfolio · allocation sums sensibly · empty portfolio.

### Task 4.4 — DCA per month
- **Files**: `packages/calculation/src/dca.ts`.
- **Details**: total invested divided by the count of distinct calendar months containing a
  purchase; `null` when there are no transactions.
- **Tests**: single month · multiple months · gap months excluded · empty input.

### Task 4.5 — Mutation-effect coverage
- **Files**: `packages/calculation/src/__tests__/mutations.test.ts`.
- **Details**: recomputation after an edited and after a deleted transaction (pure input-set
  changes) yields correct new aggregates.

**Phase verification**: 100% statement coverage of the package's public API; typecheck ✅ ·
lint ✅ · test ✅.
**Expected result**: portfolio math is provably correct and UI-independent.
**Commits**: `feat: add portfolio calculation engine` ·
`test: add portfolio calculation coverage`.

---

## PHASE 5 — Transaction Management

**Objective**: full CRUD over transactions with validation, confirmation and automatic
recalculation.

### Task 5.1 — Domain types and mapping
- **Files**: `packages/shared/src/types.ts`, `apps/web/src/features/transactions/mappers.ts`.
- **Details**: row ↔ domain mapping keeping money and shares as decimal strings.
- **Tests**: numeric strings survive the round trip without precision loss.

### Task 5.2 — Data access hooks
- **Files**: `apps/web/src/features/transactions/queries.ts`,
  `apps/web/src/features/transactions/mutations.ts`, `apps/web/src/lib/query-client.ts`.
- **Details**: TanStack Query hooks — list (with stock join), create, update, delete; cache
  invalidation on every mutation. The client never sends a chosen `user_id`.
- **Tests**: query shape, mutation payloads, invalidation after mutation (client mocked).

### Task 5.3 — Validation
- **Files**: `packages/shared/src/validation.ts`.
- **Details**: the rules in `design.md` §4.3, shared by the add and edit forms.
- **Tests**: each rule, each message, boundary values.

### Task 5.4 — Transaction form
- **Files**: `apps/web/src/features/transactions/TransactionForm.tsx`,
  `apps/web/src/features/transactions/TransactionDialog.tsx`.
- **Details**: four fields, live read-only calculated price/share, dialog on desktop and
  full-screen sheet on mobile, `inputMode="decimal"`, submit under 30 seconds of interaction.
- **Tests**: live price/share updates · invalid input blocks submit · create calls the mutation ·
  edit pre-fills and updates.

### Task 5.5 — Delete confirmation
- **Files**: `apps/web/src/features/transactions/DeleteTransactionDialog.tsx`.
- **Details**: exactly the confirmation in `design.md` §8, including "This will recalculate the
  portfolio."
- **Tests**: Cancel does nothing · Delete calls the mutation and invalidates the portfolio.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: purchases can be added, edited and deleted, and totals change accordingly.
**Commit**: `feat: add transaction management`.

---

## PHASE 6 — Dashboard

**Objective**: the primary screen, answering invested / worth / up-or-down at a glance.

### Task 6.1 — Portfolio query layer
- **Files**: `apps/web/src/features/portfolio/use-portfolio.ts`.
- **Details**: combine transactions + latest prices, map to calculation inputs, call
  `computePortfolio`. No math in components.
- **Tests**: composes inputs correctly; tolerates missing prices.

### Task 6.2 — KPI cards
- **Files**: `apps/web/src/features/portfolio/KpiCards.tsx`,
  `apps/web/src/components/Money.tsx`, `apps/web/src/components/SignedValue.tsx`.
- **Details**: Portfolio Value · Total Invested · Profit/Loss · Return % · DCA/month; explicit
  `+`/`−` signs; colour never the sole cue; `—` when a value is unavailable.
- **Tests**: profit renders `+`, loss renders `−`, zero renders without a sign artefact,
  unavailable renders `—`.

### Task 6.3 — Positions & allocation list
- **Files**: `apps/web/src/features/portfolio/PositionList.tsx`.
- **Details**: sorted positions with allocation %, profit/loss and return %; proportional bar;
  row links to stock detail.
- **Tests**: ordering, allocation percentages, unpriced position rendering.

### Task 6.4 — Recent transactions & market status strip
- **Files**: `apps/web/src/features/portfolio/RecentTransactions.tsx`,
  `apps/web/src/features/market-data/MarketStatusStrip.tsx`.
- **Details**: five most recent purchases; market status, provider name, last-updated, stale
  badge, explicit mock labelling.
- **Tests**: shows five at most; stale badge appears for an old price; mock provider labelled.

### Task 6.5 — Page states
- **Files**: `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/states/*`.
- **Details**: loading skeletons · empty state ("No investments yet. Add your first stock
  purchase." + `[ Add Purchase ]`) · error with retry · market-data error that does not break
  the page.
- **Tests**: one test per state.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: a dashboard that is correct with real data and honest with missing data.
**Commit**: `feat: add dashboard`.

---

## PHASE 7 — Market Data

**Objective**: a provider abstraction with a documented mock default, a price cache, staleness
and market status. **This phase must not block any other phase.**

### Task 7.1 — Provider interface & registry
- **Files**: `packages/shared/src/market-data.ts`,
  `apps/web/src/features/market-data/provider.ts`.
- **Details**: `MarketDataProvider`, `Quote`, `MarketStatus`; a factory resolving the configured
  provider. No consumer imports a concrete provider.
- **Tests**: the factory returns the configured provider and falls back safely.

### Task 7.2 — Mock provider
- **Files**: `apps/web/src/features/market-data/mock-provider.ts`.
- **Details**: deterministic, obviously synthetic values; `id = 'mock'`; surfaced as mock in the
  UI. **Never presented as a real price.**
- **Tests**: deterministic output; `getQuotes` handles unknown symbols; status is `unknown`.

### Task 7.3 — Free provider research (documentation task)
- **Files**: `docs/specs/market-data-providers.md`.
- **Details**: evaluate candidate free providers against Thai SET symbol support, availability,
  free-tier limits, API terms, personal-use compatibility and API-key requirement. Record the
  evidence and the decision. **Nothing is assumed free. No unauthorized scraping.**
- **Verification**: a written decision with sources. If none qualifies, the mock provider stays
  the documented default.

### Task 7.4 — Production adapter (conditional on 7.3)
- **Files**: `supabase/functions/market-data/index.ts`,
  `apps/web/src/features/market-data/<provider>-provider.ts`.
- **Details**: implemented **only if** a provider is verified in 7.3. The Edge Function holds
  the API key, fetches quotes for held symbols and writes `market_prices`.
- **Tests**: adapter maps the provider response to `Quote`; errors surface as `null` rather than
  throwing into the UI.

### Task 7.5 — Cache, staleness and status
- **Files**: `apps/web/src/features/market-data/use-latest-prices.ts`.
- **Details**: read `latest_market_prices`; treat a price older than the staleness threshold as
  stale; expose price, provider, `capturedAt` and status; on provider failure keep serving the
  cached price marked stale.
- **Tests**: fresh price → `fresh` · old price → `stale` · missing price → `null` and the
  dashboard still renders.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: honest prices — real when verified, clearly mock otherwise, never fake.
**Commits**: `feat: add market data provider` · `docs: record market data provider evaluation`.

---

## PHASE 8 — History

**Objective**: the full transaction log with search, filters and inline edit/delete.

### Task 8.1 — History query with filters
- **Files**: `apps/web/src/features/transactions/use-transaction-history.ts`.
- **Details**: server-side filtering by stock and date range, client-side text search over
  symbol and Thai name; sorted by date descending.
- **Tests**: each filter alone and combined; empty result distinguished from no data at all.

### Task 8.2 — Desktop table
- **Files**: `apps/web/src/features/transactions/TransactionTable.tsx`.
- **Details**: Date · Stock · Invested Amount · Shares · Price/Share · Actions (Edit, Delete).
- **Tests**: columns render; price/share derived, not stored; actions wired.

### Task 8.3 — Mobile cards
- **Files**: `apps/web/src/features/transactions/TransactionCard.tsx`.
- **Details**: a purpose-built card layout, not a shrunken table; touch-sized actions.
- **Tests**: renders at a mobile viewport with the same data.

### Task 8.4 — Filter controls & page states
- **Files**: `apps/web/src/pages/HistoryPage.tsx`,
  `apps/web/src/features/transactions/HistoryFilters.tsx`.
- **Details**: search box, stock dropdown (owned stocks + "All stocks"), date from/to,
  "Clear filters"; loading / empty / no-results / error states.
- **Tests**: one test per state; clear-filters restores the full list.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: any past purchase can be found and corrected quickly.
**Commit**: `feat: add transaction history`.

---

## PHASE 9 — Export

**Objective**: CSV and XLSX export across all four scopes, restricted to the user's own data.

### Task 9.1 — Export selection & filtering
- **Files**: `apps/web/src/features/export/export-filters.ts`.
- **Details**: stock (one or all) × period (all time / monthly / yearly) → a transaction set,
  reusing the history query layer. Filenames per `design.md` §10.
- **Tests**: individual stock · monthly · yearly · all; boundary dates (first/last day of a
  month and a year); empty selection.

### Task 9.2 — CSV export
- **Files**: `apps/web/src/features/export/csv.ts`.
- **Details**: columns `Date, Stock, Invested Amount, Shares, Price / Share`; UTF-8 **with BOM**;
  raw numeric values; correct escaping.
- **Tests**: header row · a value row · Thai text survives · BOM present.

### Task 9.3 — XLSX export
- **Files**: `apps/web/src/features/export/xlsx.ts`.
- **Details**: open-source `xlsx`; sheet 1 *Transactions*, sheet 2 *Summary* (total invested,
  total shares, average cost, transaction count) computed by `packages/calculation`.
- **Tests**: two sheets exist with the expected names · transaction rows correct · summary
  values match the calculation package.

### Task 9.4 — Export page
- **Files**: `apps/web/src/pages/ExportPage.tsx`,
  `apps/web/src/features/export/ExportForm.tsx`.
- **Details**: the form in `design.md` §10; Month shown only for the monthly period; a pending
  state during generation; "No transactions match this selection" instead of an empty file.
- **Tests**: form logic, format switching, the empty-result message, download triggered.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅.
**Expected result**: the owner's data is portable in both formats.
**Commits**: `feat: add csv export` · `feat: add xlsx export`.

---

## PHASE 10 — Responsive Polish

**Objective**: a genuinely good mobile-first experience and accessible interactions. Desktop
tables are never merely shrunk.

### Task 10.1 — Navigation
- **Files**: `apps/web/src/layouts/{AppShell,Sidebar,MobileNav,TopHeader}.tsx`.
- **Details**: desktop sidebar; mobile top header + fixed bottom nav (Dashboard · History ·
  Export) + a floating Add Purchase action; active-route indication.
- **Tests**: correct navigation renders per viewport; the active route is marked.

### Task 10.2 — Responsive tables, cards and forms
- **Files**: history, stock detail, dashboard components.
- **Details**: table ↔ card switching at `md`; single-column stacked forms; dialogs become
  full-screen sheets on mobile; 44px minimum touch targets.
- **Tests**: viewport-driven rendering tests.

### Task 10.3 — Accessibility & UX polish
- **Files**: shared components.
- **Details**: semantic landmarks, labelled controls, visible focus rings, WCAG AA contrast,
  focus-trapped dialogs closing on `Escape`, profit/loss conveyed by sign and text, tabular
  numerals, consistent spacing.
- **Tests**: label associations, dialog focus behaviour, `Escape` handling.

**Phase verification**: typecheck ✅ · lint ✅ · test ✅ · build ✅ · manual pass at 375px and
1440px.
**Expected result**: the app is comfortable on a phone, not a shrunken desktop.
**Commit**: `feat: polish responsive layout and accessibility`.

---

## PHASE 11 — Quality

**Objective**: close test gaps, review security, and make every gate green.

### Task 11.1 — Coverage review
- **Files**: test files across all workspaces.
- **Details**: verify every case listed in `design.md` §13 exists; fill the gaps, especially the
  calculation edge cases and every page's loading/empty/error state.
- **Verification**: coverage report; `packages/calculation` public API at 100%.

### Task 11.2 — RLS and security review
- **Files**: `supabase/migrations/*`, security test suite.
- **Details**: confirm per-command policies; run the cross-user access test; grep the built
  bundle for any secret-shaped string; confirm no `VITE_*` variable carries a server secret;
  confirm `.env` is not tracked by git.
- **Verification**: cross-user test passes (access denied); the bundle contains no secrets.

### Task 11.3 — Full gate
- **Details**: run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; fix every
  failure. Never disable a rule silently.
- **Verification**: real command output pasted into the phase report.

**Expected result**: a trustworthy, verified codebase.
**Commits**: `test: close coverage gaps` · `chore: security review fixes`.

---

## PHASE 12 — Deployment

**Objective**: DCAfolio running in production on free tiers, verified.

### Task 12.1 — GitHub
- **Details**: push `main` to a GitHub repository; confirm `.env` and `node_modules` are absent
  from history.
- **Verification**: the remote tree matches the local tree minus ignored files.

### Task 12.2 — Supabase production
- **Details**: create the project, `supabase db push`, apply the seed, configure the site URL and
  the password-reset redirect, deploy the `market-data` Edge Function (if Phase 7.4 shipped),
  set secrets with `supabase secrets set`.
- **Verification**: schema and RLS present in production; a test sign-in succeeds.

### Task 12.3 — Cloudflare Pages
- **Details**: connect the repository; build command `npm run build`; output directory
  `apps/web/dist`; Node 22; SPA fallback `/* → /index.html` (200); set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`.
- **Verification**: the deployment succeeds and deep links resolve.

### Task 12.4 — Production verification
- **Details**: login · add a purchase · dashboard figures · edit · delete · history filters · CSV
  export · XLSX export · market-status strip · mobile layout · a second account cannot see the
  first account's data.
- **Verification**: each item confirmed against the live site; results recorded.

### Task 12.5 — README
- **Files**: `README.md`.
- **Details**: overview · features · architecture · tech stack · local setup · Supabase setup ·
  environment variables · migrations · RLS · market data · testing · build · export · deployment
  · free-tier limitations · future roadmap.
- **Verification**: a clean checkout can be brought up by following the README alone.

**Expected result**: a live, free-tier DCAfolio verified end to end.
**Commits**: `chore: configure cloudflare pages deployment` · `docs: add project readme`.

---

## Final Report Requirements

At the end of every phase, report: what was implemented · files created · files modified · tests
run · test results · typecheck result · lint result · build result · git commit · known
limitations · next phase.

At final completion, additionally report: deployment URL · Supabase status · market-data provider
in use · free-tier limitations · remaining risks · recommended V2 features.
