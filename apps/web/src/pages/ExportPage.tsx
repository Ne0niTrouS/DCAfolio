import { ExportForm } from '@/features/export/ExportForm';
import { useStocks } from '@/features/transactions/queries';

export function ExportPage() {
  const { data: stocks = [] } = useStocks();

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Export Data</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your purchases as CSV or XLSX. Exports contain only your own data.
        </p>
      </div>

      <ExportForm stocks={stocks} currentYear={new Date().getFullYear()} />
    </section>
  );
}
