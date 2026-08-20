# Security Review — DCAfolio V1

Performed: **2026-08-20** (Phase 11, Task 11.2). Re-run this review before every release.
Related: [`../../CLAUDE.md`](../../CLAUDE.md) §6 · [`design.md`](design.md) §12

## Summary

| Check | Result |
| --- | --- |
| RLS enabled on every user-data table | ✅ |
| Per-command policies on private tables | ✅ |
| Cross-user access blocked (tested) | ✅ |
| Client cannot write shared reference data | ✅ |
| No client-supplied `user_id` trusted | ✅ |
| No secrets in the browser bundle | ✅ |
| No `.env` tracked by git | ✅ |
| Dependency vulnerabilities | ✅ 0 (`npm audit`) |

## 1. Row Level Security

RLS is enabled on all four tables:

```
alter table public.profiles      enable row level security
alter table public.stocks        enable row level security
alter table public.transactions  enable row level security
alter table public.market_prices enable row level security
```

Policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | own | own | own | own |
| `transactions` | own | own | own | own |
| `stocks` | any authenticated | — | — | — |
| `market_prices` | any authenticated | — | — | — |

"Own" means `user_id = (select auth.uid())`. UPDATE carries both `USING` and `WITH CHECK`, so a
row cannot be reassigned to another user mid-update.

`stocks` and `market_prices` deliberately have **no** client write policy: with RLS enabled and
no permissive policy, every client write is denied. Both are written server-side only — by
migration, or by the `market-data` Edge Function using the service role, which bypasses RLS.

Grants follow least privilege: everything is revoked from `anon` and `authenticated`, then only
the needed commands are granted back.

## 2. Cross-user access (tested)

`supabase/tests/rls.test.ts` applies the real migrations to an in-process Postgres and runs as
the `authenticated` role with `auth.uid()` resolved from a session setting — the same mechanism
Supabase uses. As a second user it verifies:

- SELECT of another user's transaction returns **0 rows**
- UPDATE of another user's transaction affects **0 rows**, and the original value is unchanged
- DELETE of another user's transaction affects **0 rows**, and the row survives
- INSERT claiming another user's `user_id` is **rejected** by the RLS policy
- omitting `user_id` defaults it to the caller's own identity
- a client INSERT into `stocks` or `market_prices` is **rejected**
- another user's `profiles` row is invisible, and creating one for someone else is rejected

27 database tests pass.

## 3. Client-supplied identity

`apps/web/src/features/transactions/mutations.ts` never sends a `user_id`. The column defaults
to `auth.uid()` and the INSERT policy checks it, so ownership is the database's decision.
A test asserts the insert payload has no `user_id` property.

## 4. Secrets

- `git ls-files | grep -i '\.env'` returns only `.env.example`. No `.env` is tracked.
- `grep -rn 'service_role\|SERVICE_ROLE'` over `apps/` and `packages/` returns nothing. The
  service-role key exists only in `supabase/functions/market-data/index.ts`, read from
  `Deno.env`, which never reaches a browser.
- The only `VITE_` variables are `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and
  `VITE_MARKET_DATA_PROVIDER`. All three are public by design; the anon key grants nothing on
  its own because RLS is the authorization boundary.
- The built bundle was scanned for secret-shaped strings (`eyJ…` JWTs, `sb_secret_…`,
  `service_role`, `sk_live_…`, PEM private keys). **No matches.**

## 5. Application-level handling

- Auth failures are mapped to generic sentences; raw provider errors are never rendered.
- A failed sign-in does not disclose which field was wrong, and the password-reset confirmation
  does not disclose whether an address is registered.
- Data errors are mapped from constraint names to the same rules the form states, so a rejected
  write never surfaces a Postgres error string.
- Exports are built from the RLS-filtered query, so they can only contain the user's own rows.

## 6. Dependencies

`npm audit` reports **0 vulnerabilities** (with and without dev dependencies).

The `xlsx` (SheetJS) package named in the original design was **rejected** during Phase 9: its
npm build is abandoned at 0.18.5 with two unfixed high-severity advisories (prototype pollution,
ReDoS). `write-excel-file` (MIT, maintained, write-only) is used instead.

## 7. Open items

- **Nothing has been verified against a live Supabase project.** RLS is proven at the SQL layer
  in PGlite; end-to-end verification through GoTrue and PostgREST happens in Phase 12.
- The `market-data` Edge Function has never been deployed or executed.
- No penetration testing or automated dependency monitoring is configured. For a single-user
  personal project that is a considered trade-off, not an oversight.
