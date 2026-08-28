import type { TranslationKey } from '@/i18n/en';

import { supabase } from './supabase';

/**
 * A failed Edge Function call, already reduced to a phrase key.
 *
 * The functions answer with codes rather than sentences for the same reason the
 * rest of the app does: the wording belongs to whichever language the reader
 * chose, and the server has no idea which that is.
 */
export class EdgeFunctionError extends Error {
  constructor(readonly key: TranslationKey) {
    super(key);
    this.name = 'EdgeFunctionError';
  }
}

function keyFrom(value: unknown): TranslationKey {
  // Every phrase key contains a dot. Anything else is a raw message from
  // Postgres or the platform, which must not reach a user.
  return typeof value === 'string' && value.includes('.')
    ? (value as TranslationKey)
    : 'error.generic';
}

/**
 * Calls an Edge Function and turns any failure into an `EdgeFunctionError`.
 *
 * supabase-js reports a non-2xx reply as a bare "non-2xx status code" error and
 * leaves the body on `error.context`, so the reason has to be read back out
 * before it can be shown to anyone.
 */
export async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (!error) return data as T;

  const context = (error as { context?: unknown }).context;

  // `context` is a Response only when the server actually answered. When the
  // fetch itself fails — offline, wrong project URL, or a preflight the
  // function did not answer — supabase-js puts the underlying error there
  // instead. Testing it for truthiness alone treats that error as a response,
  // reads no status and no body off it, and reports a connection failure as
  // "something went wrong", which sends whoever hit it looking in the wrong
  // place entirely.
  if (!(context instanceof Response)) throw new EdgeFunctionError('error.network');

  const response = context;

  // A function that was never deployed 404s, and its body is the platform's,
  // not ours. Saying "something went wrong" for that sends whoever hits it
  // hunting through the app instead of running `functions deploy`.
  if (response.status === 404) throw new EdgeFunctionError('error.functionMissing');

  const payload: unknown = await response.json().catch(() => null);
  const key = keyFrom((payload as { error?: unknown } | null)?.error);

  // Every failure is logged, not only the unrecognised ones. A translated
  // sentence is what the reader needs and all they can act on, but it is not
  // enough to fix anything by: two different faults can share one sentence.
  // The reply body says which, and it belongs somewhere it can be read.
  console.error(`Edge Function "${name}" failed with ${response.status}:`, payload);

  throw new EdgeFunctionError(key);
}
