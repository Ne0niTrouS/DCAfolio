import { describe, expect, it } from 'vitest';

import { computePortfolio, computePosition, type PositionInput } from '../portfolio';

function priced(price: string, status: 'fresh' | 'stale' = 'fresh') {
  return { price, provider: 'mock', capturedAt: '2026-08-20T09:00:00.000Z', status };
}

const CPALL: PositionInput = {
  stockId: 'stock-cpall',
  symbol: 'CPALL',
  nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  transactions: [
    { purchaseDate: '2026-06-09', investedAmount: '39250.00', shares: '625' },
    { purchaseDate: '2026-07-09', investedAmount: '39250.00', shares: '625' },
  ],
  price: priced('65.25'),
};

describe('computePosition', () => {
  it('aggregates a single purchase', () => {
    const position = computePosition({
      stockId: 's1',
      symbol: 'PTT',
      nameTh: 'บริษัท ปตท. จำกัด (มหาชน)',
      transactions: [{ purchaseDate: '2026-08-09', investedAmount: '12500', shares: '200' }],
      price: priced('65.00'),
    });

    expect(position.totalInvested).toBe('12500.00');
    expect(position.totalShares).toBe('200');
    expect(position.averageCost).toBe('62.50');
    expect(position.currentPrice).toBe('65.00');
    expect(position.currentValue).toBe('13000.00');
    expect(position.profitLoss).toBe('500.00');
    expect(position.returnPercent).toBe(4);
    expect(position.transactionCount).toBe(1);
  });

  it('aggregates multiple purchases at different prices', () => {
    const position = computePosition({
      stockId: 's1',
      symbol: 'AOT',
      nameTh: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)',
      transactions: [
        { purchaseDate: '2026-06-09', investedAmount: '10000', shares: '200' }, // 50.00
        { purchaseDate: '2026-07-09', investedAmount: '12000', shares: '200' }, // 60.00
      ],
      price: priced('50.00'),
    });

    expect(position.totalInvested).toBe('22000.00');
    expect(position.totalShares).toBe('400');
    expect(position.averageCost).toBe('55.00');
    expect(position.currentValue).toBe('20000.00');
    expect(position.profitLoss).toBe('-2000.00');
    expect(position.returnPercent).toBe(-9.09);
  });

  it('reports exactly zero profit when the price equals the average cost', () => {
    const position = computePosition({
      stockId: 's1',
      symbol: 'BBL',
      nameTh: 'ธนาคารกรุงเทพ จำกัด (มหาชน)',
      transactions: [{ purchaseDate: '2026-08-09', investedAmount: '10000', shares: '200' }],
      price: priced('50.00'),
    });

    expect(position.profitLoss).toBe('0.00');
    expect(position.returnPercent).toBe(0);
  });

  it('keeps cost figures usable when there is no market price', () => {
    const position = computePosition({ ...CPALL, price: null });

    expect(position.totalInvested).toBe('78500.00');
    expect(position.averageCost).toBe('62.80');
    expect(position.currentPrice).toBeNull();
    expect(position.currentValue).toBeNull();
    expect(position.profitLoss).toBeNull();
    expect(position.returnPercent).toBeNull();
    expect(position.priceStatus).toBe('missing');
  });

  it('still computes with a stale price, but flags it', () => {
    const position = computePosition({ ...CPALL, price: priced('65.25', 'stale') });

    expect(position.currentValue).toBe('81562.50');
    expect(position.priceStatus).toBe('stale');
    expect(position.provider).toBe('mock');
    expect(position.priceCapturedAt).toBe('2026-08-20T09:00:00.000Z');
  });

  it('handles a position with no transactions without dividing by zero', () => {
    const position = computePosition({
      stockId: 's1',
      symbol: 'SCC',
      nameTh: 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',
      transactions: [],
      price: priced('100.00'),
    });

    expect(position.totalInvested).toBe('0.00');
    expect(position.totalShares).toBe('0');
    expect(position.averageCost).toBeNull();
    expect(position.currentValue).toBe('0.00');
    expect(position.returnPercent).toBeNull();
  });

  it('rejects an invalid amount instead of producing NaN', () => {
    expect(() =>
      computePosition({
        stockId: 's1',
        symbol: 'PTT',
        nameTh: 'บริษัท ปตท. จำกัด (มหาชน)',
        transactions: [{ purchaseDate: '2026-08-09', investedAmount: 'abc', shares: '200' }],
        price: null,
      }),
    ).toThrow(/investedAmount/);
  });
});

describe('computePortfolio', () => {
  const portfolioInputs: PositionInput[] = [
    CPALL,
    {
      stockId: 'stock-ptt',
      symbol: 'PTT',
      nameTh: 'บริษัท ปตท. จำกัด (มหาชน)',
      transactions: [{ purchaseDate: '2026-08-09', investedAmount: '20000', shares: '600' }],
      price: priced('35.00'),
    },
  ];

  it('totals every position', () => {
    const portfolio = computePortfolio(portfolioInputs);

    expect(portfolio.totalInvested).toBe('98500.00');
    expect(portfolio.totalShares).toBe('1850');
    expect(portfolio.currentValue).toBe('102562.50');
    expect(portfolio.profitLoss).toBe('4062.50');
    expect(portfolio.returnPercent).toBe(4.12);
    expect(portfolio.transactionCount).toBe(3);
    expect(portfolio.hasIncompletePricing).toBe(false);
  });

  it('allocates by current value, largest position first', () => {
    const portfolio = computePortfolio(portfolioInputs);

    expect(portfolio.positions.map((p) => p.symbol)).toEqual(['CPALL', 'PTT']);
    expect(portfolio.positions[0]!.allocationPercent).toBe(79.52);
    expect(portfolio.positions[1]!.allocationPercent).toBe(20.48);
  });

  it('flags incomplete pricing and still values what it can', () => {
    const portfolio = computePortfolio([CPALL, { ...portfolioInputs[1]!, price: null }]);

    expect(portfolio.hasIncompletePricing).toBe(true);
    expect(portfolio.currentValue).toBe('81562.50');
    expect(portfolio.totalInvested).toBe('98500.00');
    expect(portfolio.positions.find((p) => p.symbol === 'PTT')!.currentValue).toBeNull();
  });

  it('reports no value at all when nothing is priced', () => {
    const portfolio = computePortfolio([
      { ...CPALL, price: null },
      { ...portfolioInputs[1]!, price: null },
    ]);

    expect(portfolio.currentValue).toBeNull();
    expect(portfolio.profitLoss).toBeNull();
    expect(portfolio.returnPercent).toBeNull();
    expect(portfolio.hasIncompletePricing).toBe(true);
  });

  it('handles an empty portfolio', () => {
    const portfolio = computePortfolio([]);

    expect(portfolio.positions).toEqual([]);
    expect(portfolio.totalInvested).toBe('0.00');
    expect(portfolio.totalShares).toBe('0');
    expect(portfolio.currentValue).toBeNull();
    expect(portfolio.profitLoss).toBeNull();
    expect(portfolio.returnPercent).toBeNull();
    expect(portfolio.dcaPerMonth).toBeNull();
    expect(portfolio.hasIncompletePricing).toBe(false);
  });

  it('orders unpriced positions by amount invested', () => {
    const portfolio = computePortfolio([
      { ...CPALL, price: null },
      { ...portfolioInputs[1]!, price: null },
    ]);

    expect(portfolio.positions.map((p) => p.symbol)).toEqual(['CPALL', 'PTT']);
    expect(portfolio.positions[0]!.allocationPercent).toBeNull();
  });
});
