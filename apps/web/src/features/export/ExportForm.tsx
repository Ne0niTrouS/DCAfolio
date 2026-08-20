import type { Stock } from '@dcafolio/shared';
import { useState } from 'react';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { fetchTransactions } from '@/features/transactions/queries';
import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';
import { downloadBlob } from '@/lib/download';
import { mapDataError } from '@/lib/errors';

import { csvBlob } from './csv';
import { fileNameFor, filtersFor, type ExportSelection } from './export-filters';
import { xlsxBlob } from './xlsx';

const MONTH_KEYS: TranslationKey[] = [
  'export.month.1',
  'export.month.2',
  'export.month.3',
  'export.month.4',
  'export.month.5',
  'export.month.6',
  'export.month.7',
  'export.month.8',
  'export.month.9',
  'export.month.10',
  'export.month.11',
  'export.month.12',
];

function yearOptions(currentYear: number): number[] {
  return Array.from({ length: 10 }, (_, offset) => currentYear - offset);
}

export function ExportForm({ stocks, currentYear }: { stocks: Stock[]; currentYear: number }) {
  const t = useT();

  const [selection, setSelection] = useState<ExportSelection>({
    stockId: null,
    period: 'all',
    year: currentYear,
    month: 1,
    format: 'xlsx',
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    tone: 'error' | 'info';
    key: TranslationKey;
  } | null>(null);

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
        setMessage({ tone: 'info', key: 'export.noMatches' });
        return;
      }

      const blob =
        selection.format === 'csv' ? csvBlob(transactions) : await xlsxBlob(transactions);

      downloadBlob(blob, fileNameFor(selection, stocks));
    } catch (error) {
      setMessage({ tone: 'error', key: mapDataError(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {message ? <Alert tone={message.tone}>{t(message.key)}</Alert> : null}

      <SelectField
        label={t('export.stock')}
        value={selection.stockId ?? ''}
        onChange={(event) => update({ stockId: event.target.value || null })}
      >
        <option value="">{t('export.allStocks')}</option>
        {stocks.map((stock) => (
          <option key={stock.id} value={stock.id}>
            {stock.symbol}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={t('export.period')}
        value={selection.period}
        onChange={(event) =>
          update({ period: event.target.value as ExportSelection['period'] })
        }
      >
        <option value="all">{t('export.allTime')}</option>
        <option value="monthly">{t('export.monthly')}</option>
        <option value="yearly">{t('export.yearly')}</option>
      </SelectField>

      {selection.period !== 'all' ? (
        <SelectField
          label={t('export.year')}
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
          label={t('export.month')}
          value={String(selection.month ?? 1)}
          onChange={(event) => update({ month: Number(event.target.value) })}
        >
          {MONTH_KEYS.map((key, index) => (
            <option key={key} value={index + 1}>
              {t(key)}
            </option>
          ))}
        </SelectField>
      ) : null}

      <SelectField
        label={t('export.format')}
        value={selection.format}
        onChange={(event) =>
          update({ format: event.target.value as ExportSelection['format'] })
        }
      >
        <option value="xlsx">XLSX</option>
        <option value="csv">CSV</option>
      </SelectField>

      <Button onClick={handleExport} pending={pending} className="mt-2">
        {t('export.export')}
      </Button>
    </div>
  );
}
