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

  const response = (error as { context?: Response }).context;

  // No response at all means the request never landed — offline, or the
  // project URL is wrong.
  if (!response) throw new EdgeFunctionError('error.network');

  // A function that was never deployed 404s, and its body is the platform's,
  // not ours. Saying "something went wrong" for that sends whoever hits it
  // hunting through the app instead of running `functions deploy`.
  if (response.status === 404) throw new EdgeFunctionError('error.functionMissing');

  const payload: unknown = await response.json().catch(() => null);
  throw new EdgeFunctionError(keyFrom((payload as { error?: unknown } | null)?.error));
}
