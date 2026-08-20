import { ExportForm } from '@/features/export/ExportForm';
import { useStocks } from '@/features/transactions/queries';
import { useT } from '@/i18n/use-language';

export function ExportPage() {
  const t = useT();
  const { data: stocks = [] } = useStocks();

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('export.title')}</h1>
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
