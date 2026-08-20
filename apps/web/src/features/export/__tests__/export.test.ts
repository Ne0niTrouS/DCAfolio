import type { Stock, TransactionWithStock } from '@dcafolio/shared';
import { describe, expect, it } from 'vitest';

import { UTF8_BOM, buildCsv } from '../csv';
import { dateRangeFor, fileNameFor, filtersFor, type ExportSelection } from '../export-filters';
import { summarise, toExportRows } from '../rows';
import { buildSummarySheet, buildTransactionsSheet, buildWorkbook } from '../xlsx';

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
  purchaseDate: string,
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

const TRANSACTIONS = [
  transaction('t1', CPALL, '39250.00', '625', '2026-06-09'),
  transaction('t2', CPALL, '39250.00', '625', '2026-07-09'),
  transaction('t3', PTT, '20000.00', '600', '2026-08-15'),
];

function selection(overrides: Partial<ExportSelection> = {}): ExportSelection {
  return { stockId: null, period: 'all', format: 'csv', ...overrides };
}

describe('dateRangeFor', () => {
  it('covers all time when no period is chosen', () => {
    expect(dateRangeFor(selection())).toEqual({});
  });

  it('covers a whole year', () => {
    expect(dateRangeFor(selection({ period: 'yearly', year: 2026 }))).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });

  it('covers a whole month, ending on its real last day', () => {
    expect(dateRangeFor(selection({ period: 'monthly', year: 2026, month: 8 }))).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
    });
    expect(dateRangeFor(selection({ period: 'monthly', year: 2026, month: 2 }))).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    // 2028 is a leap year — the last day must follow the calendar, not a guess.
    expect(dateRangeFor(selection({ period: 'monthly', year: 2028, month: 2 }))).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
  });
});

describe('filtersFor', () => {
  it('narrows to one stock and one month together', () => {
    expect(
      filtersFor(
        selection({ stockId: 'stock-cpall', period: 'monthly', year: 2026, month: 8 }),
      ),
    ).toEqual({ stockId: 'stock-cpall', from: '2026-08-01', to: '2026-08-31' });
  });

  it('applies no narrowing for all stocks over all time', () => {
    expect(filtersFor(selection())).toEqual({
      stockId: undefined,
      from: undefined,
      to: undefined,
    });
  });
});

describe('fileNameFor', () => {
  const stocks = [CPALL, PTT];

  it('names the stock and the range', () => {
    expect(
      fileNameFor(
        selection({
          stockId: 'stock-cpall',
          period: 'monthly',
          year: 2026,
          month: 8,
          format: 'xlsx',
        }),
        stocks,
      ),
    ).toBe('dcafolio_CPALL_2026-08.xlsx');

    expect(fileNameFor(selection({ period: 'yearly', year: 2026 }), stocks)).toBe(
      'dcafolio_all_2026.csv',
    );

    expect(fileNameFor(selection(), stocks)).toBe('dcafolio_all_all-time.csv');
  });
});

describe('toExportRows', () => {
  it('derives the price per share rather than reading a stored column', () => {
    expect(toExportRows([TRANSACTIONS[0]!])).toEqual([
      {
        date: '2026-06-09',
        stock: 'CPALL',
        investedAmount: '39250.00',
        shares: '625',
        pricePerShare: '62.80',
      },
    ]);
  });
});

describe('buildCsv', () => {
  const csv = buildCsv(TRANSACTIONS);

  it('starts with a byte-order mark so Excel reads Thai text correctly', () => {
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
  });

  it('uses the exact columns the design specifies', () => {
    expect(csv.slice(UTF8_BOM.length).split('\r\n')[0]).toBe(
      'Date,Stock,Invested Amount,Shares,Price / Share',
    );
  });

  it('writes raw numbers so the file re-imports cleanly', () => {
    const rows = csv.slice(UTF8_BOM.length).trimEnd().split('\r\n');

    expect(rows[1]).toBe('2026-06-09,CPALL,39250.00,625,62.80');
    expect(csv).not.toContain('฿');
    expect(csv).not.toContain('39,250');
  });

  it('writes one row per transaction', () => {
    expect(csv.slice(UTF8_BOM.length).trimEnd().split('\r\n')).toHaveLength(4);
  });

  it('escapes a value containing a comma or a quote', () => {
    const awkward = transaction('t9', { ...CPALL, symbol: 'A,B"C' }, '100', '10', '2026-08-01');

    expect(buildCsv([awkward])).toContain('"A,B""C"');
  });

  it('produces a header-only file for no transactions', () => {
    expect(buildCsv([]).slice(UTF8_BOM.length)).toBe(
      'Date,Stock,Invested Amount,Shares,Price / Share\r\n',
    );
  });
});

describe('summarise', () => {
  it('totals the selection using the calculation package', () => {
    expect(summarise(TRANSACTIONS)).toEqual({
      totalInvested: '98500.00',
      totalShares: '1850',
      averageCost: '53.24',
      transactionCount: 3,
    });
  });

  it('reports no average cost for an empty selection', () => {
    expect(summarise([])).toEqual({
      totalInvested: '0.00',
      totalShares: '0',
      averageCost: null,
      transactionCount: 0,
    });
  });
});

describe('buildWorkbook', () => {
  it('has a Transactions sheet and a Summary sheet, in that order', () => {
    const workbook = buildWorkbook(TRANSACTIONS);

    expect(workbook.map((sheet) => sheet.sheet)).toEqual(['Transactions', 'Summary']);
  });

  it('writes a header row and one row per transaction', () => {
    const sheet = buildTransactionsSheet(TRANSACTIONS);

    expect(sheet).toHaveLength(4);
    expect(sheet[0]?.map((cell) => (cell as { value: string }).value)).toEqual([
      'Date',
      'Stock',
      'Invested Amount',
      'Shares',
      'Price / Share',
    ]);
  });

  it('writes money and shares as numbers, not text', () => {
    const [, firstRow] = buildTransactionsSheet(TRANSACTIONS);
    const values = firstRow?.map((cell) => (cell as { value: unknown }).value);

    expect(values).toEqual(['2026-06-09', 'CPALL', 39250, 625, 62.8]);
  });

  it('summarises exactly the four figures the design lists', () => {
    const summary = buildSummarySheet(TRANSACTIONS);
    const labels = summary.slice(1).map((row) => (row[0] as { value: string }).value);
    const values = summary.slice(1).map((row) => (row[1] as { value: unknown }).value);

    expect(labels).toEqual([
      'Total Invested',
      'Total Shares',
      'Average Cost',
      'Transaction Count',
    ]);
    expect(values).toEqual([98500, 1850, 53.24, 3]);
  });

  it('leaves the average cost blank when nothing was purchased', () => {
    const summary = buildSummarySheet([]);

    expect((summary[3]?.[1] as { value: unknown }).value).toBeNull();
  });
});
