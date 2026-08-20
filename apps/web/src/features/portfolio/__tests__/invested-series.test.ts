import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { describe, expect, it } from 'vitest';

import { investedSeries } from '../invested-series';

const CPALL: Stock = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  isActive: true,
};

function purchase(id: string, date: string, invested: string): TransactionWithStock {
  return {
    id,
    userId: 'user-1',
    stockId: CPALL.id,
    purchaseDate: date,
    investedAmount: invested,
    shares: '100',
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
    stock: CPALL,
  };
}

describe('investedSeries', () => {
  it('has nothing to plot without purchases', () => {
    expect(investedSeries([])).toEqual([]);
  });

  it('plots a single purchase as one point', () => {
    expect(investedSeries([purchase('t1', '2026-08-09', '12500.00')])).toEqual([
      { date: '2026-08-09', total: '12500' },
    ]);
  });

  it('accumulates in date order, whatever order the rows arrive in', () => {
    const series = investedSeries([
      purchase('t2', '2026-08-09', '12500.00'),
      purchase('t1', '2026-06-09', '20000.00'),
      purchase('t3', '2026-09-01', '7500.00'),
    ]);

    expect(series).toEqual([
      { date: '2026-06-09', total: '20000' },
      { date: '2026-08-09', total: '32500' },
      { date: '2026-09-01', total: '40000' },
    ]);
  });

  it('merges purchases made on the same day into one point', () => {
    const series = investedSeries([
      purchase('t1', '2026-08-09', '12500.00'),
      purchase('t2', '2026-08-09', '500.00'),
    ]);

    expect(series).toEqual([{ date: '2026-08-09', total: '13000' }]);
  });

  it('sums with decimal arithmetic, not binary floating point', () => {
    const series = investedSeries([
      purchase('t1', '2026-08-01', '0.1'),
      purchase('t2', '2026-08-02', '0.2'),
    ]);

    // 0.1 + 0.2 === 0.30000000000000004 as a JavaScript number.
    expect(series[1]?.total).toBe('0.3');
  });
});
