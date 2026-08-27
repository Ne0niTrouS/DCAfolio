import { useMemo } from 'react';

import { ExportForm } from '@/features/export/ExportForm';
import { ownedStocks } from '@/features/transactions/owned-stocks';
import { useTransactions } from '@/features/transactions/queries';
import { useT } from '@/i18n/use-language';

export function ExportPage() {
  const t = useT();
  const { data: transactions = [] } = useTransactions();

  // The filter lists holdings, not the whole master: picking a stock you have
  // never bought could only ever produce an empty file.
  const stocks = useMemo(() => ownedStocks(transactions), [transactions]);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{t('export.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t('export.description')} {t('export.privacyNote')}
        </p>
      </div>

      <div className="max-w-md rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-sm">
        <ExportForm stocks={stocks} currentYear={new Date().getFullYear()} />
      </div>
    </section>
  );
}
