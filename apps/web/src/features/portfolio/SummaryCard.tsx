import type { Portfolio } from '@dcafolio/calculation';
import { formatShares } from '@dcafolio/shared';

import { Panel } from '@/components/Panel';
import { PieIcon } from '@/components/icons';
import { useT } from '@/i18n/use-language';

/**
 * Counts, not money — the KPI row already carries the amounts.
 *
 * There is deliberately no cash balance: DCAfolio records purchases, not a cash
 * account, so any figure under that name would be invented.
 */
export function SummaryCard({ portfolio }: { portfolio: Portfolio }) {
  const t = useT();

  const rows = [
    { label: t('dashboard.totalStocks'), value: String(portfolio.positions.length) },
    { label: t('dashboard.totalSharesLabel'), value: formatShares(portfolio.totalShares) },
    {
      label: t('dashboard.transactionCount'),
      value: String(
        portfolio.positions.reduce((count, position) => count + position.transactionCount, 0),
      ),
    },
  ];

  return (
    <Panel title={t('dashboard.summary')} icon={<PieIcon />}>
      <dl className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 text-sm">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="tnum font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
