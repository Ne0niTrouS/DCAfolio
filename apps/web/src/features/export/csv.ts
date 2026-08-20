import type { TransactionWithStock } from '@dcafolio/shared';

import { EXPORT_COLUMNS, toExportRows } from './rows';

/**
 * Excel assumes the system codepage unless a file starts with a byte-order
 * mark, which turns Thai company names into mojibake. The BOM is what makes a
 * UTF-8 CSV open correctly by double-click.
 */
export const UTF8_BOM = '﻿';

function escapeCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(transactions: TransactionWithStock[]): string {
  const rows = toExportRows(transactions);

  const lines = [
    EXPORT_COLUMNS.join(','),
    ...rows.map((row) =>
      [row.date, row.stock, row.investedAmount, row.shares, row.pricePerShare]
        .map(escapeCell)
        .join(','),
    ),
  ];

  return UTF8_BOM + lines.join('\r\n') + '\r\n';
}

export function csvBlob(transactions: TransactionWithStock[]): Blob {
  return new Blob([buildCsv(transactions)], { type: 'text/csv;charset=utf-8' });
}
