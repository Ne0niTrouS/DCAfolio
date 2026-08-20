import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';
import { Link } from 'react-router-dom';

const RECENT_LIMIT = 5;

export function RecentTransactions({ transactions }: { transactions: TransactionWithStock[] }) {
  const recent = transactions.slice(0, RECENT_LIMIT);

  return (
    <section aria-labelledby="recent-transactions-heading">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-transactions-heading" className="text-sm font-semibold text-ink">
          Recent transactions
        </h2>
        <Link to="/history" className="text-sm text-accent hover:underline">
          View all
        </Link>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {recent.map((transaction) => (
          <li
            key={transaction.id}
            className="flex items-baseline justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-2.5 text-sm"
          >
            <span className="tnum text-ink-muted">{formatDate(transaction.purchaseDate)}</span>
            <span className="font-medium text-ink">{transaction.stock.symbol}</span>
            <span className="tnum text-ink">{formatMoney(transaction.investedAmount)}</span>
            <span className="tnum text-ink-muted">
              {formatShares(transaction.shares)} shares
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
