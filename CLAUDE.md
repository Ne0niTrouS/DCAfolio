# CLAUDE.md — Operating Instructions for DCAfolio

This file is the operating instruction for Claude Code (and any other AI agent) working in this
repository. Read it before touching any file.

---

## 1. Project Identity

| Field | Value |
| --- | --- |
| Product | **DCAfolio** |
| Subtitle | Personal Stock Portfolio Tracker |
| Credit | NeOniTrouS |
| Version | V1 |
| Purpose | Personal use (single user) |
| Market | **Thai SET stocks only** |
| Repository root | this directory |

DCAfolio records real stock purchases (DCA) and automatically derives the portfolio position:
total invested, total shares, average cost, current value, profit/loss and return %.

Core flow:

```
BUY STOCK -> RECORD PURCHASE -> CALCULATE COST -> GET MARKET PRICE
          -> CALCULATE CURRENT VALUE -> CALCULATE PROFIT/LOSS -> DASHBOARD
```

Primary UX target: **record a normal purchase in under 30 seconds.**

---

## 2. Mandatory Reading

Before any implementation work, read in this order:

1. `CLAUDE.md` (this file) — rules of engagement.
2. `context.md` — why the product exists, locked scope, principles.
3. `docs/specs/design.md` — product and technical design.
4. `docs/plans/implementation-plan.md` — phase/task breakdown, current progress.

If any two of these documents contradict each other, **stop and resolve the contradiction in the
documents first**, then implement. Never resolve a contradiction silently in code.

---

## 3. Scope Rules

### 3.1 In scope for V1

Authentication (login, logout, forgot password, session persistence, protected routes),
stock master (Thai SET), transactions (create/read/update/delete + search/filter),
portfolio calculation, dashboard, stock detail, history, market data behind a provider
abstraction with cache + stale indication, CSV/XLSX export, responsive mobile-first UI,
tests, deployment to GitHub + Cloudflare Pages + Supabase.

### 3.2 Explicitly out of scope for V1

US stocks · Crypto · ETF · Mutual funds · TFEX · Sell transactions · Dividend tracking ·
Stock split · Tax calculation · Brokerage integration · Trading · Paid SET API requirement ·
Multi-user administration · Complex RBAC · Subscription billing · Notifications ·
Native mobile application · Advanced financial planning · Automated trading · Broker sync.

Keep the architecture extensible toward these, but **do not implement them**.

### 3.3 Scope-control procedure

Do not add a feature simply because it seems useful. If a request or an idea falls outside
section 3.1, **STOP** and report:

1. Why it is outside V1 scope.
2. Which files/components would be affected.
3. Impact on architecture.
4. Impact on timeline.
5. Impact on free-tier cost.

Then wait for explicit approval. Do not begin the work while waiting.

---

## 4. Architecture Rules

### 4.1 Locked technology

- Frontend: **React + TypeScript + Vite + Tailwind CSS**
- Backend platform: **Supabase-first** — Supabase Auth, Supabase PostgreSQL,
  Supabase Row Level Security, Supabase Edge Functions.
- Package manager: **npm** (npm workspaces monorepo).
- Test runner: **Vitest** (+ React Testing Library for component tests).

### 4.2 Hard architecture constraints

- **Do NOT create a separate always-running Node.js/Express CRUD backend for V1.**
- Normal authenticated CRUD goes **directly from the React app to Supabase** via
  `@supabase/supabase-js`, protected by RLS.
- Server-side / external-API work (market data fetching) goes in **Supabase Edge Functions**.
- The architecture must stay compatible with a future API/mobile layer: business logic lives in
  framework-agnostic packages, not in React components.

### 4.3 Layering

```
packages/shared       pure types, constants, formatting, validation helpers. No React. No Supabase.
packages/calculation  pure financial math. No React. No Supabase. No I/O. Decimal-safe.
apps/web              React UI + Supabase data access + market-data client.
supabase/             migrations, seed, edge functions.
```

Dependency direction is one-way: `apps/web -> packages/* `. Packages must never import from
`apps/web`.

- Calculation logic MUST be independent from React. A calculation function must be testable
  with plain data and no rendering.
- Market data MUST be isolated behind the `MarketDataProvider` interface. The dashboard and the
  calculation engine must never import a concrete provider.

---

## 5. Coding Standards

- TypeScript `strict: true`. No `any` in committed code (use `unknown` + narrowing).
- No default exports except where a framework requires it (e.g. Vite config, page modules may
  use named exports too — prefer named exports everywhere).
- File naming: React components `PascalCase.tsx`; everything else `kebab-case.ts`.
- Functions do one thing. Prefer pure functions. Side effects at the edges.
- **Financial values**: never use raw JavaScript `number` arithmetic for authoritative money
  math. Use the decimal helpers in `packages/calculation`. `number` is acceptable only for
  display after formatting, and for non-authoritative ratios like chart widths.
- Never divide by zero. Every division helper must handle a zero/invalid denominator explicitly
  and return a documented sentinel (`null`) rather than `NaN`/`Infinity`.
- Currency display: Thai Baht, `฿` prefix, thousands separators, 2 decimal places by default.
- Profit/loss must be communicated with an explicit `+` / `-` sign, never by colour alone.
- Comments explain *why*, not *what*. Keep comment density low and matched to surrounding code.
- All user-facing UI text is English; stock names carry a Thai name field (`name_th`).

---

## 6. Security Rules

- **Row Level Security is mandatory** on every user-data table. RLS must cover `SELECT`,
  `INSERT`, `UPDATE`, `DELETE`.
- A user may only read/write their own `profiles` and `transactions` rows.
- `stocks` and `market_prices` are readable by any authenticated user, and writable only by
  privileged server-side roles (Edge Function using the service-role key).
- **Never trust a client-provided `user_id`.** RLS policies must derive identity from
  `auth.uid()`. Insert policies use `WITH CHECK (user_id = auth.uid())`.
- **Never expose** the Supabase service-role key, private API keys, passwords, tokens or any
  other secret to the browser.
- **Never put a server secret in a `VITE_*` variable.** Anything prefixed `VITE_` is public.
  Server secrets belong in Supabase Edge Function secrets only.
- Never commit `.env`. Only `.env.example` is committed, and it contains no real values.
- Exports must be restricted to the authenticated user's own data (enforced by RLS, not by
  client-side filtering alone).

---

## 7. Testing Rules

Priority order: **financial calculations first**, then data access and RLS, then UI.

Required calculation test cases:

- one transaction · multiple transactions · different purchase prices
- positive profit · negative loss · zero profit
- zero shares · zero invested amount · invalid values
- missing market price · stale market price
- portfolio state after edit · portfolio state after delete

Also test: authentication protection, transaction CRUD, RLS behaviour, market-data provider
(including failure/fallback), export filters, login UI, dashboard, add/edit/delete transaction
flows, export UI, empty states, error states.

Rules:

- `packages/calculation` is developed **test-first (TDD)** and must reach 100% statement
  coverage of its public API.
- A test that has never failed has proven nothing — write the failing test before the fix.
- Do not mock the unit under test. Mock only I/O boundaries (Supabase client, HTTP).

---

## 8. Verification Rules

Before declaring **any** phase complete, run and pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build   # when the phase touched apps/web
```

- Paste the real command output when reporting. **Never claim completion merely because files
  were created.**
- If a check fails, fix it. Do not disable a rule to make a check pass without explaining why.
- If something cannot be verified locally (e.g. a live Supabase project, a deployment URL),
  say so explicitly and mark it as *unverified*, do not imply it works.

---

## 9. Git Rules

- Small, logical commits. **Never one giant commit.**
- Conventional-commit style prefixes: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`.
- One phase generally produces several commits (schema, feature, tests, docs).
- Example messages:
  `feat: initialize dcafolio web app`, `feat: add supabase schema`,
  `feat: add portfolio calculation engine`, `test: add portfolio calculation coverage`,
  `docs: add project documentation`.
- Never commit `.env`, `node_modules/`, build output, or generated coverage.
- Commit messages are normal prose — not compressed, not stylised.

---

## 10. Definition of Done (V1)

V1 is complete **only** when every line below is verified with evidence:

**Auth** — login works · logout works · forgot password works · protected routes work.

**Transactions** — add works · edit works · delete works · validation works.

**Calculation** — total invested · total shares · average cost · current value · profit/loss ·
return % all correct and covered by tests.

**Portfolio** — dashboard works · stock detail works · multiple stocks work · history works ·
search/filter works.

**Market data** — provider abstraction works · a free provider works OR the mock provider is
clearly documented as such · cache works · stale indicator works · last-updated works ·
**no fake production prices**.

**Export** — CSV works · XLSX works · per-stock · monthly · yearly · all-data · summary sheet.

**Security** — RLS works · cross-user access blocked · no secrets exposed.

**UI** — desktop works · mobile works · loading/empty/error states work.

**Quality** — tests pass · typecheck passes · lint passes · production build passes.

**Deployment** — GitHub configured · Cloudflare Pages deployed · Supabase configured ·
production verification completed.

**Documentation** — `CLAUDE.md`, `context.md`, `docs/specs/design.md`,
`docs/plans/implementation-plan.md`, `README.md` all complete and consistent.

Do not say "V1 complete" until all of the above are verified.

---

## 11. Per-Phase Workflow

For every phase in `docs/plans/implementation-plan.md`:

1. Inspect current code.
2. Re-read the relevant requirements.
3. Implement.
4. Write/update tests.
5. Run tests · typecheck · lint · build (when relevant).
6. Review changed files.
7. Commit logical changes.
8. Report: what was implemented · files created · files modified · tests run · test results ·
   typecheck result · lint result · build result · git commit · known limitations · next phase.

Never implement everything in one giant operation.
