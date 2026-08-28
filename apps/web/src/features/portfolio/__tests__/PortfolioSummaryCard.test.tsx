import type { Portfolio } from '@dcafolio/calculation';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { phrase } from '@/test/i18n-harness';

import { PortfolioSummaryCard } from '../PortfolioSummaryCard';
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

describe('PortfolioSummaryCard', () => {
  it('states the four figures once each', () => {
    // They used to appear twice under two sets of names, which made the screen
    // look like it held eight facts instead of four.
    render(<PortfolioSummaryCard portfolio={portfolio()} />);

    expect(screen.getAllByText('฿4,738.49')).toHaveLength(1);
    expect(screen.getAllByText('฿3,881.00')).toHaveLength(1);
    expect(screen.getAllByText('-฿857.49')).toHaveLength(1);
    expect(screen.getAllByText('-18.10%')).toHaveLength(1);
  });

  it('labels value, cost, profit and return', () => {
    render(<PortfolioSummaryCard portfolio={portfolio()} />);

    expect(screen.getByText(phrase('dashboard.portfolioValue'))).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.totalInvested'))).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.profitLoss'))).toBeInTheDocument();
    expect(screen.getByText(phrase('dashboard.returnPercent'))).toBeInTheDocument();
  });

  it('never mentions a monthly DCA average', () => {
    render(<PortfolioSummaryCard portfolio={portfolio()} />);

    expect(screen.queryByText(phrase('dashboard.dcaPerMonth'))).not.toBeInTheDocument();
  });

  it('says a loss in words, not only in colour', () => {
    render(<PortfolioSummaryCard portfolio={portfolio()} />);

    expect(screen.getAllByText(`(${phrase('value.loss')})`, { exact: false })).toHaveLength(2);
  });

  it('shows a dash rather than a zero when no price exists', () => {
    render(
      <PortfolioSummaryCard
        portfolio={portfolio({ currentValue: null, profitLoss: null, returnPercent: null })}
      />,
    );

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('฿0.00')).not.toBeInTheDocument();
  });

  it('warns when only some holdings are priced', () => {
    render(<PortfolioSummaryCard portfolio={portfolio({ hasIncompletePricing: true })} />);

    expect(screen.getByText(phrase('dashboard.partialPricing'))).toBeInTheDocument();
  });

  it('compares value against cost in words as well as a bar', () => {
    render(<PortfolioSummaryCard portfolio={portfolio()} />);

    expect(
      screen.getByText(phrase('dashboard.valueVsCostHint', { percent: '82' })),
    ).toBeInTheDocument();
  });
});
