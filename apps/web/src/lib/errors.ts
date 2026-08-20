/**
 * Turns a Supabase/PostgREST failure into one sentence a person can act on.
 *
 * Constraint names are the contract between the schema and this mapping: the
 * database is the last line of defence, and when it rejects something the user
 * should read the same rule the form states, not a Postgres error string.
 */
export function mapDataError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '');

  if (message.includes('transactions_invested_amount_positive')) {
    return 'Invested amount must be greater than 0.';
  }
  if (message.includes('transactions_shares_positive')) {
    return 'Shares must be greater than 0.';
  }
  if (message.includes('transactions_purchase_date_not_future')) {
    return 'Purchase date cannot be in the future.';
  }
  if (message.includes('violates foreign key')) {
    return 'That stock is no longer available. Pick another one.';
  }
  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'You do not have access to that record.';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  if (message.includes('jwt') || message.includes('token')) {
    return 'Your session has expired. Sign in again.';
  }

  return 'Something went wrong. Please try again.';
}
