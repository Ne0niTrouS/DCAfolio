import { pricePerShare } from '@dcafolio/calculation';
import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';

type TransactionTableProps = {
  transactions: TransactionWithStock[];
  onEdit: (transaction: TransactionWithStock) => void;
  onDelete: (transaction: TransactionWithStock) => void;
};

/** "Edit CPALL on 09/08/2026" — a bare "Edit" is meaningless out of row context. */
function rowLabel(action: string, transaction: TransactionWithStock): string {
  return `${action} ${transaction.stock.symbol} on ${formatDate(transaction.purchaseDate)}`;
}

/** Desktop view. Mobile uses TransactionCard — never a squeezed table. */
export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Purchase history</caption>
      <thead>
        <tr className="border-b border-border-subtle text-left text-xs uppercase tracking-wide text-ink-muted">
          <th scope="col" className="py-2 pr-3 font-medium">
            Date
          </th>
          <th scope="col" className="py-2 pr-3 font-medium">
            Stock
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Invested Amount
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Shares
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Price/Share
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id} className="border-b border-border-subtle last:border-0">
            <td className="tnum py-2.5 pr-3 text-ink-muted">
              {formatDate(transaction.purchaseDate)}
            </td>
            <td className="py-2.5 pr-3 font-medium text-ink">{transaction.stock.symbol}</td>
            <td className="tnum py-2.5 pr-3 text-right text-ink">
              {formatMoney(transaction.investedAmount)}
            </td>
            <td className="tnum py-2.5 pr-3 text-right text-ink">
              {formatShares(transaction.shares)}
            </td>
            <td className="tnum py-2.5 pr-3 text-right text-ink">
              {formatMoney(pricePerShare(transaction.investedAmount, transaction.shares))}
            </td>
            <td className="py-2.5 text-right">
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                aria-label={rowLabel('Edit', transaction)}
                className="min-h-11 px-2 text-accent hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(transaction)}
                aria-label={rowLabel('Delete', transaction)}
                className="min-h-11 px-2 text-loss hover:underline"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
