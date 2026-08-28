import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';

const here = dirname(fileURLToPath(import.meta.url));
const supabaseDir = join(here, '..', '..');

/**
 * Minimal stand-in for the parts of Supabase the migrations depend on:
 * the `auth` schema, an `auth.users` table, the `auth.uid()` helper and the
 * three Supabase roles.
 *
 * `auth.uid()` reads a session setting, which is exactly how Supabase resolves
 * the caller's identity from the JWT — so RLS policies behave here the way they
 * behave in production.
 */
const SUPABASE_SHIM = `
  create schema if not exists auth;
  create schema if not exists extensions;

  create table if not exists auth.users (
    id    uuid primary key default gen_random_uuid(),
    email text unique
  );

  create or replace function auth.uid()
  returns uuid
  language sql
  stable
  as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;

  do $$
  begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then
      create role anon nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then
      create role authenticated nologin;
    end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then
      create role service_role nologin bypassrls;
    end if;
  end
  $$;

  grant usage on schema public to anon, authenticated, service_role;
  grant usage on schema auth to anon, authenticated, service_role;
`;

export const MIGRATIONS = [
  '0001_init.sql',
  '0002_indexes.sql',
  '0003_rls.sql',
  '0004_seed_stocks.sql',
  '0005_more_stocks.sql',
  '0006_service_role_grants.sql',
];

export function migrationPath(migration: string): string {
  return join(supabaseDir, 'migrations', migration);
}

export type TestDb = PGlite;

/**
 * Boots an in-memory Postgres with the Supabase shim and every migration
 * applied. The stock master is migration 0004, so it arrives automatically —
 * exactly as it does on a real project after `supabase db push`.
 */
export async function createTestDb(): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(SUPABASE_SHIM);

  for (const migration of MIGRATIONS) {
    await db.exec(await readFile(migrationPath(migration), 'utf8'));
  }

  return db;
}

/** Creates an auth user and returns its id. */
export async function createUser(db: TestDb, email: string): Promise<string> {
  const result = await db.query<{ id: string }>(
    'insert into auth.users (email) values ($1) returning id',
    [email],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`Failed to create auth user ${email}`);
  return row.id;
}

/**
 * Runs `work` as the `authenticated` role with `auth.uid()` resolving to
 * `userId` — i.e. exactly as a signed-in browser client would run it, with RLS
 * enforced.
 */
export async function asUser<T>(
  db: TestDb,
  userId: string,
  work: () => Promise<T>,
): Promise<T> {
  // Session-scoped, not `set local`: PGlite autocommits each statement, so a
  // transaction-local setting would be gone by the time `work` runs.
  await db.query('select set_config($1, $2, false)', ['request.jwt.claim.sub', userId]);
  await db.exec('set role authenticated');
  try {
    return await work();
  } finally {
    await db.exec('reset role');
  }
}

/** Runs `work` with full privileges, bypassing RLS — stands in for the service role. */
export async function asServiceRole<T>(db: TestDb, work: () => Promise<T>): Promise<T> {
  await db.exec('reset role');
  return work();
}
