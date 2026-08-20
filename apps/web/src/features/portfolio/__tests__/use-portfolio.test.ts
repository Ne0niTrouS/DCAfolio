import type { MarketPrice, Stock, TransactionWithStock } from '@dcafolio/shared';
import { describe, expect, it } from 'vitest';

import { toPositionInputs } from '../use-portfolio';

const CPALL: Stock = {
  id: 'stock-cpall',
  symbol: 'CPALL',
  nameTh: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
  market: 'SET',
  isActive: true,
};

const PTT: Stock = {
  id: 'stock-ptt',
  symbol: 'PTT',
  nameTh: 'บริษัท ปตท. จำกัด (มหาชน)',
  market: 'SET',
  isActive: true,
};

function transaction(
  id: string,
  stock: Stock,
  investedAmount: string,
  shares: string,
  purchaseDate = '2026-08-09',
): TransactionWithStock {
  return {
    id,
    userId: 'user-1',
    stockId: stock.id,
    purchaseDate,
    investedAmount,
    shares,
    createdAt: `${purchaseDate}T10:00:00.000Z`,
    updatedAt: `${purchaseDate}T10:00:00.000Z`,
    stock,
  };
}

const FRESH_PRICE: MarketPrice = {
  stockId: 'stock-cpall',
  symbol: 'CPALL',
  price: '65.25',
  provider: 'mock',
  capturedAt: '2026-08-20T09:00:00.000Z',
  status: 'fresh',
};

describe('toPositionInputs', () => {
  it('groups every purchase of a stock into one position', () => {
    const inputs = toPositionInputs(
      [
        transaction('t1', CPALL, '39250', '625', '2026-06-09'),
        transaction('t2', CPALL, '39250', '625', '2026-07-09'),
        transaction('t3', PTT, '20000', '600'),
      ],
      [FRESH_PRICE],
    );

    expect(inputs).toHaveLength(2);
    expect(inputs[0]!.symbol).toBe('CPALL');
    expect(inputs[0]!.transactions).toHaveLength(2);
    expect(inputs[1]!.symbol).toBe('PTT');
  });

  it('attaches the cached price for the matching stock', () => {
    const inputs = toPositionInputs([transaction('t1', CPALL, '12500', '200')], [FRESH_PRICE]);

    expect(inputs[0]!.price).toEqual({
      price: '65.25',
      provider: 'mock',
      capturedAt: '2026-08-20T09:00:00.000Z',
      status: 'fresh',
    });
  });

  it('carries the stale flag through instead of hiding it', () => {
    const inputs = toPositionInputs(
      [transaction('t1', CPALL, '12500', '200')],
      [{ ...FRESH_PRICE, status: 'stale' }],
    );

    expect(inputs[0]!.price?.status).toBe('stale');
  });

  it('leaves a position unpriced when the cache holds nothing for it', () => {
    const inputs = toPositionInputs([transaction('t1', PTT, '20000', '600')], [FRESH_PRICE]);

    expect(inputs[0]!.price).toBeNull();
  });

  it('produces nothing for an empty transaction list', () => {
    expect(toPositionInputs([], [FRESH_PRICE])).toEqual([]);
  });
});
