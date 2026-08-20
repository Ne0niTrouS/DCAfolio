/**
 * Browser-safe configuration.
 *
 * Only VITE_ variables reach the bundle, and everything here is public by
 * design. A server secret must never appear in this file — see CLAUDE.md §6.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  marketDataProvider: import.meta.env.VITE_MARKET_DATA_PROVIDER ?? 'mock',
} as const;
