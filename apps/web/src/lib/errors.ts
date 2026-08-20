import type { TranslationKey } from '@/i18n/en';

/**
 * Turns a Supabase/PostgREST failure into a translation key the caller renders
 * in the reader's language.
 *
 * Constraint names are the contract between the schema and this mapping: the
 * database is the last line of defence, and when it rejects something the user
 * should read the same rule the form states, not a Postgres error string.
 */
export function mapDataError(error: unknown): TranslationKey {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '');

  if (message.includes('transactions_invested_amount_positive')) {
    return 'error.investedAmountPositive';
  }
  if (message.includes('transactions_shares_positive')) {
    return 'error.sharesPositive';
  }
  if (message.includes('transactions_purchase_date_not_future')) {
    return 'error.purchaseDateFuture';
  }
  if (message.includes('violates foreign key')) {
    return 'error.stockUnavailable';
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'error.forbidden';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'error.network';
  }
  if (message.includes('jwt') || message.includes('token')) {
    return 'error.sessionExpired';
  }

  return 'error.generic';
}
