-- DCAfolio 0002 — indexes
--
-- Access patterns these support:
--   dashboard / history : transactions for one user, newest purchase first
--   stock detail        : transactions for one user and one stock
--   price lookup        : latest capture per stock (drives latest_market_prices)
--
-- Symbol lookup on the stock master needs no index here: stocks.symbol is
-- UNIQUE, which already creates one.

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, purchase_date desc);

create index if not exists transactions_user_stock_idx
  on public.transactions (user_id, stock_id);

create index if not exists market_prices_stock_time_idx
  on public.market_prices (stock_id, captured_at desc);
