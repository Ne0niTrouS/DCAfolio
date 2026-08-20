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
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';
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
  const t = useT();
  const remove = useDeleteTransaction();
  const [error, setError] = useState<TranslationKey | null>(null);

  const perShare = pricePerShare(transaction.investedAmount, transaction.shares);

  function handleDelete() {
    setError(null);
    remove.mutate(transaction.id, {
      onSuccess: onClose,
      onError: (cause) => setError(mapDataError(cause)),
    });
  }

  return (
    <Modal title={t('purchase.deleteTitle')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error ? <Alert>{t(error)}</Alert> : null}

        <dl className="rounded-xl border border-border-subtle bg-surface-sunken px-3 py-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">{t('history.stock')}</dt>
            <dd className="font-semibold text-ink">{transaction.stock.symbol}</dd>
          </div>
          <div className="mt-1.5 flex justify-between">
            <dt className="text-ink-muted">{t('history.date')}</dt>
            <dd className="tnum text-ink">{formatDate(transaction.purchaseDate)}</dd>
          </div>
          <div className="mt-1.5 flex justify-between">
            <dt className="text-ink-muted">{t('history.investedAmount')}</dt>
            <dd className="tnum text-ink">{formatMoney(transaction.investedAmount)}</dd>
          </div>
          <div className="mt-1.5 flex justify-between">
            <dt className="text-ink-muted">{t('history.shares')}</dt>
            <dd className="tnum text-ink">
              {formatShares(transaction.shares)} {t('common.sharesUnit')}
            </dd>
          </div>
          <div className="mt-1.5 flex justify-between">
            <dt className="text-ink-muted">{t('history.pricePerShare')}</dt>
            <dd className="tnum text-ink">{formatMoney(perShare)}</dd>
          </div>
        </dl>

        <p className="text-sm text-ink-muted">{t('purchase.deleteWarning')}</p>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            pending={remove.isPending}
            onClick={handleDelete}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
