import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';
import { Link } from 'react-router-dom';

import { useT } from '@/i18n/use-language';

const RECENT_LIMIT = 5;

export function RecentTransactions({ transactions }: { transactions: TransactionWithStock[] }) {
  const t = useT();
  const recent = transactions.slice(0, RECENT_LIMIT);

  return (
    <section aria-labelledby="recent-transactions-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="recent-transactions-heading"
          className="text-sm font-semibold tracking-tight text-ink"
        >
          {t('dashboard.recentTransactions')}
        </h2>
        <Link to="/history" className="text-sm font-medium text-accent-strong hover:underline">
          {t('dashboard.viewAll')}
        </Link>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {recent.map((transaction) => (
          <li
            key={transaction.id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3 text-sm shadow-sm"
          >
            <span className="tnum text-ink-muted">{formatDate(transaction.purchaseDate)}</span>
            <span className="font-semibold text-ink">{transaction.stock.symbol}</span>
            <span className="tnum text-ink">{formatMoney(transaction.investedAmount)}</span>
            <span className="tnum text-ink-muted">
              {formatShares(transaction.shares)} {t('common.sharesUnit')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
