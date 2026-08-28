import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { InvestedPanel } from '../InvestedPanel';
import type { InvestedPoint } from '../invested-series';

const ONE: InvestedPoint[] = [{ date: '2026-08-27', total: '4738.49' }];
const TWO: InvestedPoint[] = [
  { date: '2026-07-15', total: '2500.00' },
  { date: '2026-08-27', total: '4738.49' },
];

describe('InvestedPanel', () => {
  it('says there is nothing recorded rather than drawing an empty box', () => {
    render(<InvestedPanel points={[]} />);

    expect(screen.getByText(phrase('dashboard.noChartData'))).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('refuses to draw a trend from a single purchase', () => {
    // The old chart stretched a flat line across the panel between two copies
    // of the same date, which looked like history and was not.
    render(<InvestedPanel points={ONE} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.notEnoughHistory'))).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.historyHint'))).toBeInTheDocument();
  });

  it('still states the real figure it does have', () => {
    render(<InvestedPanel points={ONE} />);

    expect(screen.getByText('฿4,738.49')).toBeInTheDocument();
    expect(
      screen.getByText(phrase('dashboard.singlePointDate', { date: '27/08/2026' })),
    ).toBeInTheDocument();
  });

  it('draws the chart once there are two dates to join', () => {
    render(<InvestedPanel points={TWO} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByText(phrase('dashboard.notEnoughHistory'))).not.toBeInTheDocument();
  });

  it('labels the chart with real dates at both ends', () => {
    render(<InvestedPanel points={TWO} />);

    expect(screen.getByText('15/07/2026')).toBeInTheDocument();
    expect(screen.getByText('27/08/2026')).toBeInTheDocument();
  });
});
