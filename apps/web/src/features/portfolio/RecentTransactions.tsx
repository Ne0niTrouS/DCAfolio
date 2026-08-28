import { pricePerShare } from '@dcafolio/calculation';
import {
  formatDate,
  formatMoney,
  formatShares,
  type TransactionWithStock,
} from '@dcafolio/shared';
import { Link } from 'react-router-dom';

import { Panel } from '@/components/Panel';
import { CalendarIcon } from '@/components/icons';
import { useT } from '@/i18n/use-language';

/** Ten rows: enough to cover a month of weekly buying without leaving the page. */
const RECENT_LIMIT = 10;

/** The symbol as a badge — it is an identifier, not prose. */
function Ticker({ symbol }: { symbol: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent-strong">
      {symbol}
    </span>
  );
}

export function RecentTransactions({ transactions }: { transactions: TransactionWithStock[] }) {
  const t = useT();
  const recent = transactions.slice(0, RECENT_LIMIT);

  return (
    <Panel
      title={t('dashboard.recentTransactions')}
      action={
        <Link to="/history" className="text-sm font-medium text-accent-strong hover:underline">
          {t('dashboard.viewAll')}
        </Link>
      }
    >
      <div className="overflow-x-auto">
        {/* Named by aria-label rather than a caption: the panel heading already
            says the same words, and a caption would repeat them on screen. */}
        <table
          aria-label={t('dashboard.recentTransactions')}
          className="w-full min-w-125 border-collapse text-sm"
        >
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">
                {t('history.date')}
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                {t('dashboard.ticker')}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">
                {t('history.investedAmount')}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-semibold">
                {t('history.shares')}
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                {t('history.pricePerShare')}
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((transaction) => (
              <tr key={transaction.id} className="border-b border-border-subtle last:border-0">
                <td className="py-3 pr-3">
                  <span className="tnum flex items-center gap-2 text-ink-muted">
                    <CalendarIcon className="size-4 text-ink-faint" />
                    {formatDate(transaction.purchaseDate)}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <Ticker symbol={transaction.stock.symbol} />
                </td>
                <td className="tnum py-3 pr-3 text-right font-medium text-ink">
                  {formatMoney(transaction.investedAmount)}
                </td>
                <td className="tnum py-3 pr-3 text-right text-ink-muted">
                  {formatShares(transaction.shares)}
                </td>
                <td className="tnum py-3 text-right text-ink-muted">
                  {formatMoney(pricePerShare(transaction.investedAmount, transaction.shares))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
