import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { useState } from 'react';

import { Modal } from '@/components/Modal';
import { mapDataError } from '@/lib/errors';

import { TransactionForm, type TransactionFormValues } from './TransactionForm';
import { useCreateTransaction, useUpdateTransaction } from './mutations';

type TransactionDialogProps = {
  stocks: Stock[];
  /** Present when editing; absent when adding. */
  transaction?: TransactionWithStock | undefined;
  today: string;
  onClose: () => void;
};

export function TransactionDialog({
  stocks,
  transaction,
  today,
  onClose,
}: TransactionDialogProps) {
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [error, setError] = useState<string | null>(null);

  const isEdit = transaction !== undefined;

  function handleSubmit(values: TransactionFormValues) {
    setError(null);
    const onError = (cause: unknown) => setError(mapDataError(cause));

    if (isEdit) {
      update.mutate({ id: transaction.id, input: values }, { onSuccess: onClose, onError });
    } else {
      create.mutate(values, { onSuccess: onClose, onError });
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Purchase' : 'Add Purchase'} onClose={onClose}>
      <TransactionForm
        stocks={stocks}
        today={today}
        submitLabel={isEdit ? 'Save' : 'Add Purchase'}
        pending={create.isPending || update.isPending}
        error={error}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialValues={
          transaction
            ? {
                purchaseDate: transaction.purchaseDate,
                stockId: transaction.stockId,
                investedAmount: transaction.investedAmount,
                shares: transaction.shares,
              }
            : undefined
        }
      />
    </Modal>
  );
}
