# DCAfolio — Deployment Runbook

Everything here needs accounts and credentials, so it is executed by the project owner rather
than by an agent. Follow the steps in order; each one states how to tell it worked.

Related: [`implementation-plan.md`](implementation-plan.md) Phase 12 ·
[`../specs/design.md`](../specs/design.md) §14 · [`../specs/security-review.md`](../specs/security-review.md)

**Target: zero recurring cost.** GitHub Free, Supabase Free and Cloudflare Pages Free are all
that V1 requires.

---

## Before you start

| Requirement | Notes |
| --- | --- |
| Node 22+ | `node -v`. Node 22.22.2 or newer avoids a `jsdom` engine warning. |
| A GitHub account | Free tier. |
| A Supabase account | Free tier. |
| A Cloudflare account | Free tier. |
| Supabase CLI | No install needed — every command below uses `npx supabase`. |

Confirm the project is green locally first:

```bash
npm install && npm run verify
```

`verify` runs typecheck, lint, the full test suite and the production build.

---

## Step 1 — GitHub

```bash
git remote add origin https://github.com/<you>/dcafolio.git
git push -u origin main
```

**Verify:** the repository contains no `.env` and no `node_modules`:

```bash
git ls-files | grep -E "^\.env$|node_modules" || echo "clean"
```

`.env.example` is expected; a bare `.env` is not.

---

## Step 2 — Create the Supabase project

1. Create a new project at <https://supabase.com/dashboard>. Choose the **Southeast Asia
   (Singapore)** region — it is the closest to Thailand.
2. Store the database password somewhere safe. You will need it for `db push`.
3. From **Project Settings → API**, copy the **Project URL** and the **anon / public** key.

**Never copy the `service_role` key into this project's `.env`, into any `VITE_` variable, or
into a chat window.** It bypasses RLS. It belongs only in Supabase Edge Function secrets
(Step 5).

---

## Step 3 — Apply the schema

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

That applies all four migrations, including the stock master. The Supabase CLI has no command
that runs an arbitrary SQL file against a remote project, which is exactly why the stock master
is migration `0004_seed_stocks.sql` rather than a separate seed file.

**Verify** in the dashboard SQL editor:

```sql
select tablename, rowsecurity from pg_tables
 where schemaname = 'public' order by tablename;
-- expect: market_prices, profiles, stocks, transactions — all rowsecurity = true

select count(*) from public.stocks;          -- expect 21
select count(*) from pg_policies where schemaname = 'public';  -- expect 10
```

> The stock master is a starter list, not the full SET listing, and several Thai companies have renamed
> recently. Check the symbols and Thai names you actually hold against
> <https://www.set.or.th>, and correct them with a **new migration** — never by editing the
> production database by hand.

---

## Step 4 — Create your account and configure auth

V1 has **no sign-up screen**: this is a single-owner personal app, and
`supabase/config.toml` sets `enable_signup = false`.

1. **Authentication → Users → Add user**. Use your email and a strong password, and tick
   *Auto Confirm User*.
2. **Authentication → Providers**: leave Email enabled, everything else disabled.
3. **Authentication → URL Configuration**:
   - Site URL: your Cloudflare Pages URL (fill this in after Step 6, then come back).
   - Additional redirect URLs: `https://<your-domain>/reset-password`

Without that redirect URL the password-reset link will not return to the app.

**Verify:** the user appears in the Users list with a confirmed timestamp.

---

## Step 5 — Deploy the market-data Edge Function

```bash
npx supabase functions deploy market-data
npx supabase functions deploy stock-admin
npx supabase secrets set MARKET_DATA_PROVIDER=mock
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically; do not set them
yourself.

**Verify:**

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/market-data" \
  -H "Authorization: Bearer <anon-key>"
# expect: {"provider":"mock","captured":0,"stale":0}   (0 until you record a purchase)
```

> **The provider is a mock.** No free source of Thai SET quotes could be verified — see
> [`../specs/market-data-providers.md`](../specs/market-data-providers.md). Its prices are
> synthetic and are labelled *"Mock data — not real prices"* everywhere in the UI. Portfolio
> value and profit/loss on a live deployment are therefore **not real** until a verified
> provider is added. Total invested, share counts and average cost are always real: they come
> from your own transactions.

`stock-admin` needs no secrets of its own — `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` are all injected. It is what the Stocks page calls to add an entry to
the shared master, because RLS gives the browser no write access to `stocks`. Verify it refuses
an anonymous caller:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/stock-admin" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TEST","nameTh":"ทดสอบ"}'
# expect: 401 {"error":"error.sessionExpired"} — no user token, no write
```

Optional, once you have transactions: schedule a refresh with `pg_cron` in the dashboard, or
invoke the function manually. There is deliberately no scheduler in V1.

---

## Step 6 — Cloudflare Pages

**Workers & Pages → Create → Pages → Connect to Git**, select the repository, then:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `apps/web/dist` |
| Root directory | *(leave empty — this is a monorepo root build)* |
| Environment variable | `NODE_VERSION` = `22` |
| Environment variable | `VITE_SUPABASE_URL` = your project URL |
| Environment variable | `VITE_SUPABASE_ANON_KEY` = your anon key |
| Environment variable | `VITE_MARKET_DATA_PROVIDER` = `mock` |

Set the variables for **both** Production and Preview, or preview deployments will fail at
startup — `lib/env.ts` throws loudly rather than shipping a half-configured client.

### SPA fallback (required)

Client-side routing means `/history` must serve `index.html`. Add a file at
`apps/web/public/_redirects`:

```
/*    /index.html   200
```

Without it, deep links and page reloads return 404.

**Verify:** the build succeeds, and opening `https://<your-site>.pages.dev/history` directly
loads the app rather than a 404.

---

## Step 6b — IIS (alternative to Cloudflare Pages)

Use this instead of Step 6 to host DCAfolio on Windows Server or IIS Express. **Supabase is
still in the cloud**: IIS serves only the built front end, and the browser talks to Supabase
directly. Nothing about auth, RLS or the database changes.

### Prerequisites

| Requirement | Notes |
| --- | --- |
| IIS with **URL Rewrite 2.1** | <https://www.iis.net/downloads/microsoft/url-rewrite>. **Not** part of a default IIS install. Without it IIS returns `500.19` on the `<rewrite>` section of `web.config`. |
| Node 22+ | Only to *build*. IIS serves plain files; no Node runtime on the server. |
| An HTTPS binding | See the warning below. |

### 1. Build with the production values

`VITE_*` variables are **compiled into the bundle**, not read at runtime — so the build must
happen with the values the deployed site will use. There is nothing to configure on the server
afterwards.

```bash
npm ci
npm run build
```

With `.env` at the repository root holding:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_MARKET_DATA_PROVIDER=mock
```

**Never put the `service_role` key in any `VITE_` variable.** It bypasses RLS and would be
readable by anyone who opens the bundle.

### 2. Copy the output

Copy the **contents** of `apps/web/dist` — not the folder itself — into the IIS physical path:

```powershell
Copy-Item -Recurse -Force apps\web\dist\* C:\inetpub\wwwroot\dcafolio\
```

`dist\web.config` comes along with it. That file is the whole IIS configuration: the SPA
fallback rewrite, MIME types for the extensions a Vite build emits, `no-cache` on `index.html`
and a one-year immutable cache on the hashed files under `assets/`. It lives at
`apps/web/public/web.config`, so it is version-controlled and every build reproduces it.

### 3. Site root or sub-application?

| Deployment | `base` | Build command |
| --- | --- | --- |
| Its own IIS **site** (`https://host/`) | `/` | `npm run build` |
| An IIS **application** under a site (`https://host/dcafolio`) | `/dcafolio/` | set `VITE_BASE_PATH` first |

```powershell
$env:VITE_BASE_PATH = '/dcafolio/'
npm run build
```

Both slashes matter. Get this wrong and the page loads blank, because every asset URL points one
directory too high. `BrowserRouter` reads the same value, so routing follows automatically.

### 4. Application pool

Set the pool's **.NET CLR version** to *No Managed Code*. Nothing here is ASP.NET; the managed
pipeline only adds startup cost and failure modes.

### 5. Auth URLs

Go to **Supabase → Authentication → URL Configuration** and use the IIS address:

- Site URL: `https://your-host/dcafolio`
- Additional redirect URLs: `https://your-host/dcafolio/reset-password`

> **Serve it over HTTPS.** The Supabase session token is held in `localStorage` and sent on
> every request. Over plain `http` on a shared network, anyone in the middle can read it and act
> as you. An internal-only server is not an exception — issue a certificate and bind 443.

### Verify

| # | Check | Expected |
| --- | --- | --- |
| 1 | Open the site root | The login screen, in Thai |
| 2 | Browse to `/history` and press F5 | The app reloads — not an IIS 404 |
| 3 | DevTools → Network | No request for a `.js` or `.css` that 404s |
| 4 | DevTools → Console | No "Missing environment variable" error |
| 5 | Sign in | The dashboard loads and the session survives a reload |

### Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `500.19` with error code `0x8007000d` and an empty *Config Source* | URL Rewrite is not installed, so IIS cannot parse the `<rewrite>` section | Install the module, or use the fallback below |
| Deep link returns a plain IIS `404` | `web.config` was not copied, or the module is missing | Confirm `web.config` sits beside `index.html` |
| Page is blank, DevTools shows `404` on `/assets/…` | `base` does not match the application path | Rebuild with `VITE_BASE_PATH` |
| `Missing environment variable VITE_SUPABASE_URL` in the console | The build ran without `.env` | Rebuild with the values in place |

Confirm whether the module is present before guessing:

```powershell
Test-Path "$env:windir\System32\inetsrv\rewrite.dll"
```

### If URL Rewrite cannot be installed

`docs/deploy/web.config.no-url-rewrite` reaches the same result with `<httpErrors>`, which is
built into IIS. Copy it over the deployed `web.config`, renamed, and edit the `path` to match the
application path.

Verified working on IIS 10 at `/DCA_Folio`: the root, `/history`, `/stocks/CPALL` and `/export`
all return **200** with the app rendered, hashed assets keep their one-year immutable cache, and
`index.html` stays `no-cache`.

It has one real flaw: it swallows genuine 404s. A request for an asset that does not exist also
returns 200 with the HTML of `index.html`, so a bad deploy surfaces as a MIME-type error in the
console rather than a clean 404. URL Rewrite does not do that — it rewrites only when the path is
not a real file — which is why the module is still the better answer.

---

## Step 7 — Close the loop on auth URLs

Go back to **Supabase → Authentication → URL Configuration** and set:

- Site URL: `https://<your-site>.pages.dev`
- Additional redirect URLs: `https://<your-site>.pages.dev/reset-password`

---

## Step 8 — Production verification

Work through every line. Record the result; do not assume.

| # | Check | Expected |
| --- | --- | --- |
| 1 | Open the site signed out | Login screen with "DCAfolio", "Personal Stock Tracker", "© NeOniTrouS" |
| 2 | Visit `/history` signed out | Redirected to `/login` |
| 3 | Sign in | Dashboard loads, empty state invites a first purchase |
| 4 | Reload the page | Still signed in — no login flash |
| 5 | Add a purchase (CPALL, ฿12,500, 200 shares) | Form shows `฿62.50/share` before you submit; takes under 30 seconds |
| 6 | Dashboard | Total Invested `฿12,500.00`; value/profit show `—` until prices exist |
| 7 | Invoke the market-data function, reload | A price appears, labelled "Mock data — not real prices" |
| 8 | Stock detail (`/stocks/CPALL`) | Shares 200, average cost `฿62.50`, purchase history listed |
| 9 | Edit the purchase to ฿13,000 | Average cost becomes `฿65.00` immediately |
| 10 | Delete it | Confirmation names the stock, date, amount and shares, and says the portfolio will be recalculated |
| 11 | History filters | Stock filter and date range both narrow the list; search matches symbol and Thai name |
| 12 | Export CSV (all, all time) | Downloads; opens in Excel with Thai names intact and numbers as numbers |
| 13 | Export XLSX (monthly) | Two sheets: Transactions and Summary; summary totals match the dashboard |
| 14 | Mobile (375px) | Bottom navigation, cards instead of a table, Add Purchase reachable |
| 15 | Forgot password | Reset email arrives and the link returns to `/reset-password` |
| 16 | Sign out | Returns to `/login`; `/` redirects back to login |
| 17 | **Cross-user isolation** | Create a second user in the dashboard, sign in as them: the first user's transactions are invisible |

Check 17 is the one that matters most. RLS is proven in tests at the SQL layer; this is the
end-to-end proof through GoTrue and PostgREST.

---

## Free-tier limits to know

| Service | Free tier | What it means here |
| --- | --- | --- |
| Supabase | Project pauses after ~1 week of inactivity; 500 MB database; 5 GB egress | A paused project makes the app fail to sign in until you resume it from the dashboard. Opening the app weekly avoids this. |
| Cloudflare Pages | 500 builds/month; unlimited bandwidth | One build per push. Nowhere near the limit for personal use. |
| GitHub | Unlimited private repositories | No limit that matters here. |

Nothing in V1 requires a paid plan. Optional future costs — a custom domain, a paid market-data
feed, a Supabase paid tier if usage grows — are explicit decisions, not defaults.

---

## Rollback

- **Web**: Cloudflare Pages keeps every deployment. *Deployments → … → Rollback*.
- **Database**: migrations are forward-only. To undo a schema change, write a new migration.
  Never edit the production schema by hand.
- **Code**: `git revert <sha>` and push; Pages rebuilds automatically.
