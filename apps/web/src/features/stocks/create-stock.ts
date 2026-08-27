import type { Stock } from '@dcafolio/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { mapStock, type StockRow } from '@/features/transactions/mappers';
import type { TranslationKey } from '@/i18n/en';
import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

export type NewStock = { symbol: string; nameTh: string };

/**
 * An error the Edge Function reported, already reduced to a phrase key.
 *
 * The function returns codes rather than sentences for the same reason the rest
 * of the app does: the wording belongs to whichever language the reader chose.
 */
export class StockAdminError extends Error {
  constructor(readonly key: TranslationKey) {
    super(key);
    this.name = 'StockAdminError';
  }
}

function keyFrom(value: unknown): TranslationKey {
  return typeof value === 'string' && value.includes('.')
    ? (value as TranslationKey)
    : 'error.generic';
}

/**
 * Adds a stock to the shared master.
 *
 * Not a direct insert: RLS gives clients SELECT on `stocks` and nothing more, so
 * the write goes through the `stock-admin` Edge Function, which checks the
 * caller and the payload before using its privileged key.
 */
export async function createStock(input: NewStock): Promise<Stock> {
  const { data, error } = await supabase.functions.invoke('stock-admin', {
    body: { symbol: input.symbol, nameTh: input.nameTh },
  });

  if (error) {
    // A non-2xx reply carries the reason in its body, which invoke() does not
    // surface on the error itself.
    const body: unknown = await (error as { context?: Response }).context
      ?.json()
      .catch(() => null);
    throw new StockAdminError(keyFrom((body as { error?: unknown } | null)?.error));
  }

  const row = (data as { stock?: StockRow } | null)?.stock;
  if (!row) throw new StockAdminError('error.generic');

  return mapStock(row);
}

export function useCreateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStock,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.stocks });
    },
  });
}
