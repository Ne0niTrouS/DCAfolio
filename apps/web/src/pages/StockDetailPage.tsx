import { useParams } from 'react-router-dom';

/** Placeholder. The full position view is built in Phase 6. */
export function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{symbol}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Position detail and purchase history arrive in Phase 6.
      </p>
    </section>
  );
}
