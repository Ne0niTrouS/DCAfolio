import { pricePerShare } from '@dcafolio/calculation';
import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';

import { Button } from '@/components/Button';

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
  const perShare = pricePerShare(transaction.investedAmount, transaction.shares);
  const label = `${transaction.stock.symbol} on ${formatDate(transaction.purchaseDate)}`;

  return (
    <article className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-ink">{transaction.stock.symbol}</span>
        <span className="tnum text-sm text-ink-muted">
          {formatDate(transaction.purchaseDate)}
        </span>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Invested</dt>
          <dd className="tnum text-ink">{formatMoney(transaction.investedAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">Shares</dt>
          <dd className="tnum text-ink">{formatShares(transaction.shares)}</dd>
        </div>
        <div className="col-span-2 flex justify-between">
          <dt className="text-ink-muted">Price / share</dt>
          <dd className="tnum text-ink">{formatMoney(perShare)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => onEdit(transaction)}
          aria-label={`Edit ${label}`}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => onDelete(transaction)}
          aria-label={`Delete ${label}`}
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
