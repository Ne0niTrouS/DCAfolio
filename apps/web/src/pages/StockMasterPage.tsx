import { useMemo, useState } from 'react';

import { Button } from '@/components/Button';
import { Panel } from '@/components/Panel';
import { TextField } from '@/components/TextField';
import { ErrorState } from '@/components/states';
import { StockMasterSkeleton } from '@/features/stocks/StockMasterSkeleton';
import { paginate } from '@/features/stocks/paging';
import { useStocks } from '@/features/transactions/queries';
import { useT } from '@/i18n/use-language';
import { mapDataError } from '@/lib/errors';

/**
 * The shared list of Thai SET symbols, searchable and paged.
 *
 * Read-only. Adding a symbol is a migration (`supabase/migrations/`), which
 * keeps the repository the definition of what production holds; the register
 * is not something to edit from a browser between two other tasks.
 */
export function StockMasterPage() {
  const t = useT();
  const { data: stocks = [], isLoading, error, refetch } = useStocks();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const matching = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stocks;
    return stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(needle) ||
        stock.nameTh.toLowerCase().includes(needle),
    );
  }, [stocks, search]);

  // `paginate` clamps, so a search that shortens the list cannot strand the
  // reader on a page that no longer exists.
  const shown = paginate(matching, page);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{t('master.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('master.description')}</p>
      </div>

      <Panel
        title={t('master.title')}
        action={
          <span className="text-sm text-ink-muted">
            {t('master.count', { count: stocks.length })}
          </span>
        }
      >
        <div className="mb-4">
          <TextField
            label={t('master.search')}
            type="search"
            placeholder={t('master.searchPlaceholder')}
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
          />
        </div>

        {isLoading ? <StockMasterSkeleton /> : null}

        {!isLoading && error ? (
          <ErrorState
            title={t('master.loadError')}
            description={t(mapDataError(error))}
            onRetry={() => void refetch()}
          />
        ) : null}

        {!isLoading && !error ? (
          shown.total === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">{t('master.empty')}</p>
          ) : (
            <>
              <ul className="flex flex-col divide-y divide-border-subtle">
                {shown.items.map((stock) => (
                  <li
                    key={stock.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
                  >
                    <span className="font-semibold text-ink">{stock.symbol}</span>
                    <span className="min-w-0 flex-1 truncate text-right text-sm text-ink-muted">
                      {stock.nameTh}
                    </span>
                  </li>
                ))}
              </ul>

              <nav
                aria-label={t('master.pagination')}
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4"
              >
                {/* Stated in words as well as buttons: "‹ ›" alone leaves a
                    reader guessing how much of the list they have seen. */}
                <p aria-live="polite" className="tnum text-sm text-ink-muted">
                  {t('master.showing', {
                    from: shown.from,
                    to: shown.to,
                    total: shown.total,
                  })}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="px-3"
                    disabled={shown.page <= 1}
                    onClick={() => setPage(shown.page - 1)}
                  >
                    {t('common.previous')}
                  </Button>
                  <span className="tnum text-sm text-ink-muted">
                    {t('master.pageOf', { page: shown.page, pageCount: shown.pageCount })}
                  </span>
                  <Button
                    variant="secondary"
                    className="px-3"
                    disabled={shown.page >= shown.pageCount}
                    onClick={() => setPage(shown.page + 1)}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </nav>
            </>
          )
        ) : null}
      </Panel>
    </section>
  );
}
