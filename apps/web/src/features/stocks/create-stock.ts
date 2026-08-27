import type { Stock } from '@dcafolio/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { mapStock, type StockRow } from '@/features/transactions/mappers';
import { EdgeFunctionError, invokeEdgeFunction } from '@/lib/edge-function';
import { queryKeys } from '@/lib/query-client';

export type NewStock = { symbol: string; nameTh: string };

/**
 * Adds a stock to the shared master.
 *
 * Not a direct insert: RLS gives clients SELECT on `stocks` and nothing more, so
 * the write goes through the `stock-admin` Edge Function, which checks the
 * caller and the payload before using its privileged key.
 */
export async function createStock(input: NewStock): Promise<Stock> {
  const data = await invokeEdgeFunction<{ stock?: StockRow } | null>('stock-admin', {
    symbol: input.symbol,
    nameTh: input.nameTh,
  });

  const row = data?.stock;
  if (!row) throw new EdgeFunctionError('error.generic');

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
