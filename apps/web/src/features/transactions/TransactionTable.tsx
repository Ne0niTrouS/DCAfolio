import { pricePerShare } from '@dcafolio/calculation';
import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';

import { useT } from '@/i18n/use-language';

type TransactionTableProps = {
  transactions: TransactionWithStock[];
  onEdit: (transaction: TransactionWithStock) => void;
  onDelete: (transaction: TransactionWithStock) => void;
};

/** Desktop view. Mobile uses TransactionCard — never a squeezed table. */
export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  const t = useT();

  /** "Edit CPALL on 09/08/2026" — a bare "Edit" is meaningless out of row context. */
  function rowLabel(
    key: 'history.editRow' | 'history.deleteRow',
    transaction: TransactionWithStock,
  ): string {
    return t(key, {
      symbol: transaction.stock.symbol,
      date: formatDate(transaction.purchaseDate),
    });
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">{t('history.caption')}</caption>
      <thead>
        <tr className="border-b border-border-subtle bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-muted">
          <th scope="col" className="px-4 py-3 font-semibold">
            {t('history.date')}
          </th>
          <th scope="col" className="px-4 py-3 font-semibold">
            {t('history.stock')}
          </th>
          <th scope="col" className="px-4 py-3 text-right font-semibold">
            {t('history.investedAmount')}
          </th>
          <th scope="col" className="px-4 py-3 text-right font-semibold">
            {t('history.shares')}
          </th>
          <th scope="col" className="px-4 py-3 text-right font-semibold">
            {t('history.pricePerShare')}
          </th>
          <th scope="col" className="px-4 py-3 text-right font-semibold">
            {t('history.actions')}
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr
            key={transaction.id}
            className="border-b border-border-subtle transition-colors last:border-0 hover:bg-surface-sunken"
          >
            <td className="tnum px-4 py-3 text-ink-muted">
              {formatDate(transaction.purchaseDate)}
            </td>
            <td className="px-4 py-3 font-semibold text-ink">{transaction.stock.symbol}</td>
            <td className="tnum px-4 py-3 text-right text-ink">
              {formatMoney(transaction.investedAmount)}
            </td>
            <td className="tnum px-4 py-3 text-right text-ink">
              {formatShares(transaction.shares)}
            </td>
            <td className="tnum px-4 py-3 text-right text-ink">
              {formatMoney(pricePerShare(transaction.investedAmount, transaction.shares))}
            </td>
            <td className="px-4 py-3 text-right">
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                aria-label={rowLabel('history.editRow', transaction)}
                className="min-h-11 px-2 font-medium text-accent-strong hover:underline"
              >
                {t('common.edit')}
              </button>
              <button
                type="button"
                onClick={() => onDelete(transaction)}
                aria-label={rowLabel('history.deleteRow', transaction)}
                className="min-h-11 px-2 font-medium text-loss hover:underline"
              >
                {t('common.delete')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
