import { formatDate, formatMoney } from '@dcafolio/shared';

import { Panel } from '@/components/Panel';
import { TrendUpIcon } from '@/components/icons';
import { useT } from '@/i18n/use-language';

import { InvestedChart } from './InvestedChart';
import type { InvestedPoint } from './invested-series';

/**
 * Cumulative invested amount, drawn only when there is a trend to draw.
 *
 * Three cases, and the middle one is the reason this exists. The series has one
 * point per day a purchase happened, so a new portfolio has exactly one — and a
 * chart of one point is either an empty box or, as it was, a flat line stretched
 * across the panel between two copies of the same date. That looks like history
 * and is not.
 *
 * No history is invented to fill the gap. DCAfolio stores the latest price and
 * nothing older, so a value curve for past days cannot be drawn from real data,
 * and drawing it from today's price would be fabrication. What the panel says
 * instead is the truth: there is not enough recorded yet.
 */
export function InvestedPanel({ points }: { points: InvestedPoint[] }) {
  const t = useT();
  const title = t('dashboard.investedOverTime');
  const latest = points[points.length - 1];

  return (
    <Panel title={title} icon={<TrendUpIcon />}>
      {points.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-muted">{t('dashboard.noChartData')}</p>
      ) : points.length === 1 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="tnum text-3xl font-semibold tracking-tight text-ink">
            {formatMoney(latest?.total)}
          </p>
          <p className="text-sm text-ink-muted">
            {t('dashboard.singlePointDate', { date: formatDate(latest?.date) })}
          </p>
          <p className="max-w-sm text-sm font-medium text-ink">
            {t('dashboard.notEnoughHistory')}
          </p>
          <p className="max-w-sm text-xs text-ink-faint">{t('dashboard.historyHint')}</p>
        </div>
      ) : (
        <InvestedChart points={points} label={title} />
      )}
    </Panel>
  );
}
