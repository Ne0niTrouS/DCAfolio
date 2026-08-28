-- DCAfolio 0007 — withdraw the write access `stock-admin` needed
--
-- The `stock-admin` Edge Function is gone: it let the browser add a symbol to
-- the shared register, and the owner decided the register should be read-only
-- again. A symbol arrives by migration, which keeps this repository the
-- definition of what production holds.
--
-- 0006 granted `service_role` INSERT on `public.stocks` for that function alone.
-- Nothing holds that privilege open now, and a standing write path that nothing
-- uses is a write path nobody is watching. `market-data`, the only remaining
-- function, reads `stocks` to resolve the symbols it prices and never writes
-- them.
--
-- Migrations still insert freely: they run as `postgres`, not `service_role`.

revoke insert on public.stocks from service_role;
