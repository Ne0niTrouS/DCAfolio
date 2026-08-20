import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

export type TransactionInput = {
  purchaseDate: string;
  stockId: string;
  /** Decimal strings — sent as text so PostgreSQL parses them into numeric. */
  investedAmount: string;
  shares: string;
};

function toRow(input: TransactionInput) {
  // user_id is deliberately absent: the column defaults to auth.uid() and the
  // RLS INSERT policy checks it, so the client never chooses an owner.
  return {
    stock_id: input.stockId,
    purchase_date: input.purchaseDate,
    invested_amount: input.investedAmount,
    shares: input.shares,
  };
}

export async function createTransaction(input: TransactionInput): Promise<void> {
  const { error } = await supabase.from('transactions').insert(toRow(input));
  if (error) throw error;
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const { error } = await supabase.from('transactions').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Every mutation invalidates the transaction queries. Nothing is stored as an
 * aggregate, so invalidation is all that "recalculate the portfolio" requires.
 */
function useTransactionMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
  });
}

export function useCreateTransaction() {
  return useTransactionMutation(createTransaction);
}

export function useUpdateTransaction() {
  return useTransactionMutation(({ id, input }: { id: string; input: TransactionInput }) =>
    updateTransaction(id, input),
  );
}

export function useDeleteTransaction() {
  return useTransactionMutation((id: string) => deleteTransaction(id));
}
