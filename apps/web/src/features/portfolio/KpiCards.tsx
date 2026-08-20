import type { Portfolio } from '@dcafolio/calculation';
import { UNAVAILABLE, formatMoney } from '@dcafolio/shared';

import { SignedMoney, SignedPercent } from '@/components/SignedValue';

function Card({
  label,
  children,
  note,
}: {
  label: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold">{children}</p>
      {note ? <p className="mt-1 text-xs text-ink-muted">{note}</p> : null}
    </div>
  );
}

/** The five numbers that answer: what did I put in, what is it worth, am I up? */
export function KpiCards({ portfolio }: { portfolio: Portfolio }) {
  const partial = portfolio.hasIncompletePricing;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Card
        label="Portfolio Value"
        {...(partial ? { note: 'Partial — some stocks have no price yet' } : {})}
      >
        <span className="tnum text-ink">
          {portfolio.currentValue === null ? UNAVAILABLE : formatMoney(portfolio.currentValue)}
        </span>
      </Card>

      <Card label="Total Invested">
        <span className="tnum text-ink">{formatMoney(portfolio.totalInvested)}</span>
      </Card>

      <Card label="Profit/Loss">
        <SignedMoney value={portfolio.profitLoss} />
      </Card>

      <Card label="Return %">
        <SignedPercent value={portfolio.returnPercent} />
      </Card>

      <Card label="DCA/month">
        <span className="tnum text-ink">
          {portfolio.dcaPerMonth === null ? UNAVAILABLE : formatMoney(portfolio.dcaPerMonth)}
        </span>
      </Card>
    </div>
  );
}
