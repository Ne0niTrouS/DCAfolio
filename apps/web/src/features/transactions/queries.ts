import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

import { mapStock, mapTransaction, type StockRow, type TransactionRow } from './mappers';

/** Money and share columns are cast to text so no precision is lost in JSON. */
const TRANSACTION_SELECT = `
  id,
  user_id,
  stock_id,
  purchase_date,
  invested_amount::text,
  shares::text,
  created_at,
  updated_at,
  stocks ( id, symbol, name_th, market, is_active )
`;

const STOCK_SELECT = 'id, symbol, name_th, market, is_active';

export type TransactionFilters = {
  stockId?: string | undefined;
  /** Inclusive ISO date bounds. */
  from?: string | undefined;
  to?: string | undefined;
};

export async function fetchTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionWithStock[]> {
  let query = supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .order('purchase_date', { ascending: false })
    .order('created_at', { ascending: false });

  // RLS already scopes rows to the signed-in user; these are only user filters.
  if (filters.stockId) query = query.eq('stock_id', filters.stockId);
  if (filters.from) query = query.gte('purchase_date', filters.from);
  if (filters.to) query = query.lte('purchase_date', filters.to);

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as TransactionRow[]).map(mapTransaction);
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactionList(filters),
    queryFn: () => fetchTransactions(filters),
  });
}

export async function fetchStocks(): Promise<Stock[]> {
  const { data, error } = await supabase
    .from('stocks')
    .select(STOCK_SELECT)
    .eq('is_active', true)
    .order('symbol');

  if (error) throw error;
  return (data as unknown as StockRow[]).map(mapStock);
}

export function useStocks() {
  return useQuery({
    queryKey: queryKeys.stocks,
    queryFn: fetchStocks,
    // The stock master is reference data; it changes by migration, not by use.
    staleTime: 60 * 60 * 1000,
  });
}
