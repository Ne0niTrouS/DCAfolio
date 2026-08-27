// DCAfolio — stock-admin Edge Function (Deno).
//
// The only writer of public.stocks other than a migration.
//
// RLS deliberately grants clients SELECT on the stock master and nothing else
// (0003_rls.sql): it is shared reference data, and a browser that could write it
// could also rename or deactivate a symbol under every other reader. So the app
// asks this function instead. It runs with the service-role key, which bypasses
// RLS — which is exactly why it must verify the caller and the payload itself
// rather than trusting either.
//
// Order of checks: caller is signed in → payload is well formed → symbol is not
// already taken → insert.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Mirrors packages/shared/src/stock-validation.ts. Kept in step by hand: Deno
 *  cannot import from the npm workspace, and duplicating ~20 lines is cheaper
 *  than publishing a package for them. */
const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9&.-]*$/;
const SYMBOL_MAX_LENGTH = 20;
const NAME_TH_MAX_LENGTH = 200;

type Payload = { symbol?: unknown; nameTh?: unknown };

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

function validate(payload: Payload): { symbol: string; nameTh: string } | string {
  if (typeof payload.symbol !== 'string') return 'validation.symbolRequired';
  if (typeof payload.nameTh !== 'string') return 'validation.nameThRequired';

  const symbol = payload.symbol.trim().toUpperCase();
  const nameTh = payload.nameTh.trim();

  if (!symbol) return 'validation.symbolRequired';
  if (symbol.length > SYMBOL_MAX_LENGTH) return 'validation.symbolTooLong';
  if (!SYMBOL_PATTERN.test(symbol)) return 'validation.symbolFormat';
  if (!nameTh) return 'validation.nameThRequired';
  if (nameTh.length > NAME_TH_MAX_LENGTH) return 'validation.nameThTooLong';

  return { symbol, nameTh };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Function is not configured' }, 500);
  }

  // Identify the caller with their own token and the anon key — never with the
  // service-role client, which would report a valid user for any input.
  const authorization = request.headers.get('Authorization') ?? '';
  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: caller, error: callerError } = await asCaller.auth.getUser();
  if (callerError || !caller.user) {
    return json({ error: 'error.sessionExpired' }, 401);
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json({ error: 'validation.symbolRequired' }, 400);
  }

  const validated = validate(payload);
  if (typeof validated === 'string') {
    return json({ error: validated }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: inserted, error: insertError } = await admin
    .from('stocks')
    .insert({ symbol: validated.symbol, name_th: validated.nameTh, market: 'SET' })
    .select('id, symbol, name_th, market, is_active')
    .single();

  if (insertError) {
    // 23505 is unique_violation: the symbol already exists.
    if (insertError.code === '23505') {
      return json({ error: 'error.symbolTaken' }, 409);
    }
    console.error('stock-admin insert failed:', insertError);
    return json({ error: 'error.generic' }, 500);
  }

  return json({ stock: inserted }, 201);
});
