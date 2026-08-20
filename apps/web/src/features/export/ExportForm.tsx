import type { Stock } from '@dcafolio/shared';
import { useState } from 'react';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { fetchTransactions } from '@/features/transactions/queries';
import { downloadBlob } from '@/lib/download';
import { mapDataError } from '@/lib/errors';

import { csvBlob } from './csv';
import { fileNameFor, filtersFor, type ExportSelection } from './export-filters';
import { xlsxBlob } from './xlsx';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function yearOptions(currentYear: number): number[] {
  return Array.from({ length: 10 }, (_, offset) => currentYear - offset);
}

export function ExportForm({ stocks, currentYear }: { stocks: Stock[]; currentYear: number }) {
  const [selection, setSelection] = useState<ExportSelection>({
    stockId: null,
    period: 'all',
    year: currentYear,
    month: 1,
    format: 'xlsx',
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  function update(patch: Partial<ExportSelection>) {
    setSelection((current) => ({ ...current, ...patch }));
  }

  async function handleExport() {
    setPending(true);
    setMessage(null);

    try {
      // Fetched through the normal RLS-filtered query, so an export can only
      // ever contain the signed-in user's own transactions.
      const transactions = await fetchTransactions(filtersFor(selection));

      if (transactions.length === 0) {
        setMessage({ tone: 'info', text: 'No transactions match this selection.' });
        return;
      }

      const blob =
        selection.format === 'csv' ? csvBlob(transactions) : await xlsxBlob(transactions);

      downloadBlob(blob, fileNameFor(selection, stocks));
    } catch (error) {
      setMessage({ tone: 'error', text: mapDataError(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <SelectField
        label="Stock"
        value={selection.stockId ?? ''}
        onChange={(event) => update({ stockId: event.target.value || null })}
      >
        <option value="">All Stocks</option>
        {stocks.map((stock) => (
          <option key={stock.id} value={stock.id}>
            {stock.symbol}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Period"
        value={selection.period}
        onChange={(event) =>
          update({ period: event.target.value as ExportSelection['period'] })
        }
      >
        <option value="all">All time</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </SelectField>

      {selection.period !== 'all' ? (
        <SelectField
          label="Year"
          value={String(selection.year ?? currentYear)}
          onChange={(event) => update({ year: Number(event.target.value) })}
        >
          {yearOptions(currentYear).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
      ) : null}

      {selection.period === 'monthly' ? (
        <SelectField
          label="Month"
          value={String(selection.month ?? 1)}
          onChange={(event) => update({ month: Number(event.target.value) })}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </SelectField>
      ) : null}

      <SelectField
        label="Format"
        value={selection.format}
        onChange={(event) =>
          update({ format: event.target.value as ExportSelection['format'] })
        }
      >
        <option value="xlsx">XLSX</option>
        <option value="csv">CSV</option>
      </SelectField>

      <Button onClick={handleExport} pending={pending} className="mt-2">
        Export
      </Button>
    </div>
  );
}
