import { pricePerShare } from '@dcafolio/calculation';
import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';

import { Button } from '@/components/Button';
import { useT } from '@/i18n/use-language';

type TransactionCardProps = {
  transaction: TransactionWithStock;
  onEdit: (transaction: TransactionWithStock) => void;
  onDelete: (transaction: TransactionWithStock) => void;
};

/**
 * Mobile view: a purpose-built card, not a shrunken table row. The same five
 * facts, stacked, with touch-sized actions.
 */
export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const t = useT();
  const perShare = pricePerShare(transaction.investedAmount, transaction.shares);
  const labelParams = {
    symbol: transaction.stock.symbol,
    date: formatDate(transaction.purchaseDate),
  };

  return (
    <article className="rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3.5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold tracking-tight text-ink">
          {transaction.stock.symbol}
        </span>
        <span className="tnum text-sm text-ink-muted">
          {formatDate(transaction.purchaseDate)}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">{t('history.investedAmount')}</dt>
          <dd className="tnum text-ink">{formatMoney(transaction.investedAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">{t('history.shares')}</dt>
          <dd className="tnum text-ink">{formatShares(transaction.shares)}</dd>
        </div>
        <div className="col-span-2 flex justify-between">
          <dt className="text-ink-muted">{t('history.pricePerShare')}</dt>
          <dd className="tnum text-ink">{formatMoney(perShare)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onEdit(transaction)}
          aria-label={t('history.editRow', labelParams)}
        >
          {t('common.edit')}
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => onDelete(transaction)}
          aria-label={t('history.deleteRow', labelParams)}
        >
          {t('common.delete')}
        </Button>
      </div>
    </article>
  );
}
