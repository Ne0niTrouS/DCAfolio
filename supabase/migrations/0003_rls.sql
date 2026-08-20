-- DCAfolio 0003 — Row Level Security
--
-- RLS is the authorization boundary for this product. There is no server-side
-- CRUD layer to enforce ownership, so every user-data table must deny by
-- default and allow only rows belonging to auth.uid().
--
-- A client-supplied user_id is never trusted: INSERT is gated by
-- WITH CHECK (user_id = auth.uid()), and UPDATE carries both USING and
-- WITH CHECK so a row cannot be handed to another user mid-update.

alter table public.profiles      enable row level security;
alter table public.stocks        enable row level security;
alter table public.transactions  enable row level security;
alter table public.market_prices enable row level security;

-- ---------------------------------------------------------------------------
-- profiles — private to the owner
-- ---------------------------------------------------------------------------

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- stocks — shared reference data, read-only for clients
-- ---------------------------------------------------------------------------

create policy stocks_select_authenticated on public.stocks
  for select to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policy: with RLS enabled and no permissive policy,
-- every client write is denied. The stock master changes only by migration or
-- by a privileged server-side role, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- transactions — private to the owner, all four commands
-- ---------------------------------------------------------------------------

create policy transactions_select_own on public.transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy transactions_insert_own on public.transactions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy transactions_update_own on public.transactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy transactions_delete_own on public.transactions
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- market_prices — readable by any signed-in user, written only server-side
-- ---------------------------------------------------------------------------

create policy market_prices_select_authenticated on public.market_prices
  for select to authenticated
  using (true);

-- No client write policy. The market-data Edge Function writes with the
-- service-role key, which bypasses RLS; that key never reaches the browser.

-- ---------------------------------------------------------------------------
-- least-privilege grants
-- ---------------------------------------------------------------------------

revoke all on public.profiles      from anon, authenticated;
revoke all on public.stocks        from anon, authenticated;
revoke all on public.transactions  from anon, authenticated;
revoke all on public.market_prices from anon, authenticated;

grant select, insert, update, delete on public.profiles     to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select on public.stocks        to authenticated;
grant select on public.market_prices to authenticated;
grant select on public.latest_market_prices to authenticated;
