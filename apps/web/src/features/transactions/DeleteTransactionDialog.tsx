import { pricePerShare } from '@dcafolio/calculation';
import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';
import { useState } from 'react';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { mapDataError } from '@/lib/errors';

import { useDeleteTransaction } from './mutations';

type DeleteTransactionDialogProps = {
  transaction: TransactionWithStock;
  onClose: () => void;
};

export function DeleteTransactionDialog({
  transaction,
  onClose,
}: DeleteTransactionDialogProps) {
  const remove = useDeleteTransaction();
  const [error, setError] = useState<string | null>(null);

  const perShare = pricePerShare(transaction.investedAmount, transaction.shares);

  function handleDelete() {
    setError(null);
    remove.mutate(transaction.id, {
      onSuccess: onClose,
      onError: (cause) => setError(mapDataError(cause)),
    });
  }

  return (
    <Modal title="Delete Transaction?" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error ? <Alert>{error}</Alert> : null}

        <dl className="rounded-lg bg-surface-sunken px-3 py-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Stock</dt>
            <dd className="font-medium text-ink">{transaction.stock.symbol}</dd>
          </div>
          <div className="mt-1 flex justify-between">
            <dt className="text-ink-muted">Date</dt>
            <dd className="tnum text-ink">{formatDate(transaction.purchaseDate)}</dd>
          </div>
          <div className="mt-1 flex justify-between">
            <dt className="text-ink-muted">Invested</dt>
            <dd className="tnum text-ink">{formatMoney(transaction.investedAmount)}</dd>
          </div>
          <div className="mt-1 flex justify-between">
            <dt className="text-ink-muted">Shares</dt>
            <dd className="tnum text-ink">{formatShares(transaction.shares)} shares</dd>
          </div>
          <div className="mt-1 flex justify-between">
            <dt className="text-ink-muted">Price / share</dt>
            <dd className="tnum text-ink">{formatMoney(perShare)}</dd>
          </div>
        </dl>

        <p className="text-sm text-ink-muted">This will recalculate the portfolio.</p>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            pending={remove.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
