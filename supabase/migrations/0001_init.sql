-- DCAfolio 0001 — core schema
--
-- Transactions are the single source of truth. Every portfolio figure (total
-- invested, total shares, average cost, current value, profit/loss, return %)
-- is derived from them, so there are deliberately no stored aggregate columns
-- that could drift out of sync.
--
-- All money and share columns use numeric, never float, so values survive the
-- round trip between PostgreSQL and JavaScript without precision loss.

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'Trigger helper: stamps updated_at on every UPDATE.';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Created on first sign-in.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stocks (shared master data)
-- ---------------------------------------------------------------------------

create table if not exists public.stocks (
  id         uuid primary key default gen_random_uuid(),
  symbol     text not null unique,
  name_th    text not null,
  market     text not null default 'SET',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  constraint stocks_symbol_uppercase check (symbol = upper(symbol)),
  constraint stocks_symbol_not_blank check (length(btrim(symbol)) > 0),
  constraint stocks_name_th_not_blank check (length(btrim(name_th)) > 0),
  -- V1 is Thai SET only. Widening this constraint is a scope change that
  -- requires explicit approval (see CLAUDE.md section 3).
  constraint stocks_market_set_only check (market = 'SET')
);

comment on table public.stocks is
  'Thai SET stock master. Shared, read-only for clients, seeded by migration.';

-- ---------------------------------------------------------------------------
-- transactions (source of truth)
-- ---------------------------------------------------------------------------

create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stock_id        uuid not null references public.stocks (id) on delete restrict,
  purchase_date   date not null,
  invested_amount numeric(18, 2) not null,
  shares          numeric(18, 4) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint transactions_invested_amount_positive check (invested_amount > 0),
  constraint transactions_shares_positive check (shares > 0),
  constraint transactions_purchase_date_not_future check (purchase_date <= current_date)
);

comment on table public.transactions is
  'Authoritative record of real stock purchases. Price per share is always '
  'derived as invested_amount / shares and is never stored.';

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- market_prices (append-only cache)
-- ---------------------------------------------------------------------------

create table if not exists public.market_prices (
  id          uuid primary key default gen_random_uuid(),
  stock_id    uuid not null references public.stocks (id) on delete cascade,
  price       numeric(18, 4) not null,
  provider    text not null,
  captured_at timestamptz not null default now(),
  is_stale    boolean not null default false,
  constraint market_prices_price_positive check (price > 0),
  constraint market_prices_provider_not_blank check (length(btrim(provider)) > 0)
);

comment on table public.market_prices is
  'Append-only cache of successful market-data captures. Written only by the '
  'market-data Edge Function; never presented to the user as real-time.';

-- Latest successful capture per stock. The client reads prices from here and
-- decides staleness at read time, so an old price stays honest even if the
-- refresh job has stopped running.
create or replace view public.latest_market_prices
with (security_invoker = true)
as
select distinct on (mp.stock_id)
  mp.stock_id,
  s.symbol,
  mp.price,
  mp.provider,
  mp.captured_at,
  mp.is_stale
from public.market_prices mp
join public.stocks s on s.id = mp.stock_id
order by mp.stock_id, mp.captured_at desc;

comment on view public.latest_market_prices is
  'Most recent market price per stock. security_invoker keeps the caller''s RLS in effect.';
