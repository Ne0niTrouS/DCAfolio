import type { Portfolio } from '@dcafolio/calculation';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { CostVsValueCard } from '../CostVsValueCard';
import { barPercent } from '../cost-vs-value';

function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    positions: [],
    totalInvested: '4738.49',
    totalShares: '1100',
    currentValue: '3881.00',
    profitLoss: '-857.49',
    returnPercent: -18.1,
    dcaPerMonth: null,
    transactionCount: 3,
    hasIncompletePricing: false,
    ...overrides,
  };
}

describe('barPercent', () => {
  it('measures value against cost', () => {
    expect(barPercent('1000', '750')).toBe(75);
  });

  it('caps a doubled portfolio so the bar stays in its track', () => {
    expect(barPercent('1000', '3000')).toBe(100);
  });

  it('has nothing to draw without a price', () => {
    expect(barPercent('1000', null)).toBeNull();
  });

  it('never divides by a zero cost', () => {
    expect(barPercent('0', '500')).toBeNull();
  });
});

describe('CostVsValueCard', () => {
  it('puts cost and current value side by side', () => {
    render(<CostVsValueCard portfolio={portfolio()} />);

    expect(screen.getByText(phrase('dashboard.totalCost'))).toBeInTheDocument();
    expect(screen.getByText('฿4,738.49')).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.currentValue'))).toBeInTheDocument();
    expect(screen.getByText('฿3,881.00')).toBeInTheDocument();
  });

  it('states the gap with an explicit sign', () => {
    render(<CostVsValueCard portfolio={portfolio()} />);

    expect(screen.getByText('-฿857.49')).toBeInTheDocument();
    expect(screen.getByText('-18.10%')).toBeInTheDocument();
  });

  it('says a loss in words, not only in colour', () => {
    render(<CostVsValueCard portfolio={portfolio()} />);

    expect(screen.getAllByText(`(${phrase('value.loss')})`, { exact: false }).length).toBe(2);
  });

  it('shows a dash rather than a zero when no price exists', () => {
    render(
      <CostVsValueCard
        portfolio={portfolio({ currentValue: null, profitLoss: null, returnPercent: null })}
      />,
    );

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('฿0.00')).not.toBeInTheDocument();
  });

});
