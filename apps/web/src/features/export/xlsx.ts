import type { TransactionWithStock } from '@dcafolio/shared';
import writeXlsxFile, { type Sheet, type SheetData } from 'write-excel-file/browser';

import { EXPORT_COLUMNS, summarise, toExportRows } from './rows';

/** The library's sheet type, bound to the browser's file-content types. */
type BrowserSheet = Sheet<File | Blob | ArrayBuffer>;

/**
 * XLSX is produced with `write-excel-file`, not the `xlsx` (SheetJS) package
 * the design originally named: the npm build of `xlsx` is abandoned at 0.18.5
 * with two unfixed high-severity advisories. `write-excel-file` is MIT,
 * maintained, browser-first and write-only, which is all this feature needs.
 *
 * Numbers are written as numbers, not strings, so the workbook is usable for
 * arithmetic the moment it opens.
 */

const HEADER = { fontWeight: 'bold' } as const;

export function buildTransactionsSheet(transactions: TransactionWithStock[]): SheetData {
  const rows = toExportRows(transactions);

  return [
    EXPORT_COLUMNS.map((column) => ({ value: column, ...HEADER })),
    ...rows.map((row) => [
      { value: row.date, type: String },
      { value: row.stock, type: String },
      { value: Number(row.investedAmount), type: Number, format: '#,##0.00' },
      { value: Number(row.shares), type: Number },
      {
        value: row.pricePerShare === '' ? null : Number(row.pricePerShare),
        type: Number,
        format: '#,##0.00',
      },
    ]),
  ] as SheetData;
}

export function buildSummarySheet(transactions: TransactionWithStock[]): SheetData {
  const summary = summarise(transactions);

  return [
    [
      { value: 'Metric', ...HEADER },
      { value: 'Value', ...HEADER },
    ],
    [
      { value: 'Total Invested', type: String },
      { value: Number(summary.totalInvested), type: Number, format: '#,##0.00' },
    ],
    [
      { value: 'Total Shares', type: String },
      { value: Number(summary.totalShares), type: Number },
    ],
    [
      { value: 'Average Cost', type: String },
      summary.averageCost === null
        ? { value: null, type: Number }
        : { value: Number(summary.averageCost), type: Number, format: '#,##0.00' },
    ],
    [
      { value: 'Transaction Count', type: String },
      { value: summary.transactionCount, type: Number },
    ],
  ] as SheetData;
}

export function buildWorkbook(transactions: TransactionWithStock[]): BrowserSheet[] {
  return [
    { sheet: 'Transactions', data: buildTransactionsSheet(transactions) },
    { sheet: 'Summary', data: buildSummarySheet(transactions) },
  ];
}

export async function xlsxBlob(transactions: TransactionWithStock[]): Promise<Blob> {
  return writeXlsxFile(buildWorkbook(transactions)).toBlob();
}
