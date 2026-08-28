-- DCAfolio 0006 — table privileges for the Edge Functions
--
-- `service_role` bypasses RLS, and it is easy to read that as "can do
-- anything". It cannot. Row Level Security and table privileges are separate
-- mechanisms: a role that bypasses every policy still needs a GRANT, and
-- without one Postgres answers `42501 permission denied` before any policy is
-- ever consulted.
--
-- 0003 granted to `authenticated` and left `service_role` to whatever default
-- privileges the project happened to carry. On this project it carried none, so
-- both Edge Functions failed in production against a schema whose policies were
-- entirely correct — `market-data` could not read the transactions it was meant
-- to price, and `stock-admin` could not insert a symbol. The app could only
-- report that something had gone wrong.
--
-- Granted here explicitly rather than left to the platform's defaults, so the
-- repository states what the functions may do and `supabase/tests/service-role.test.ts`
-- can hold it to that.
--
-- Least privilege, matched to what the two functions actually do:
--
--   market-data  reads transactions, embeds stocks, reads and appends market_prices
--   stock-admin  reads stocks, inserts one row into stocks
--
-- Deliberately NOT granted: any access to `profiles`, and UPDATE or DELETE on
-- anything. Neither function needs them, and a service-role write of that kind
-- would pass straight through the policies protecting a user's own records.

grant select on public.transactions to service_role;

grant select, insert on public.stocks to service_role;

grant select, insert on public.market_prices to service_role;
grant select on public.latest_market_prices to service_role;
