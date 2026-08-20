import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { useState } from 'react';

import { Modal } from '@/components/Modal';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';
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
  const t = useT();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [error, setError] = useState<TranslationKey | null>(null);

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
    <Modal title={t(isEdit ? 'purchase.editTitle' : 'purchase.addTitle')} onClose={onClose}>
      <TransactionForm
        stocks={stocks}
        today={today}
        submitLabel={t(isEdit ? 'common.save' : 'common.addPurchase')}
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
