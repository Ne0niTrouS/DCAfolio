import { useMemo, useState } from 'react';

import { Panel } from '@/components/Panel';
import { TextField } from '@/components/TextField';
import { ErrorState, LoadingState } from '@/components/states';
import { AddStockForm } from '@/features/stocks/AddStockForm';
import { useStocks } from '@/features/transactions/queries';
import { useT } from '@/i18n/use-language';
import { mapDataError } from '@/lib/errors';

export function StockMasterPage() {
  const t = useT();
  const { data: stocks = [], isLoading, error, refetch } = useStocks();
  const [search, setSearch] = useState('');

  const matching = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return stocks;
    return stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(needle) ||
        stock.nameTh.toLowerCase().includes(needle),
    );
  }, [stocks, search]);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{t('master.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('master.description')}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
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
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {isLoading ? <LoadingState /> : null}

          {!isLoading && error ? (
            <ErrorState
              title={t('master.loadError')}
              description={t(mapDataError(error))}
              onRetry={() => void refetch()}
            />
          ) : null}

          {!isLoading && !error ? (
            matching.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">{t('master.empty')}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border-subtle">
                {matching.map((stock) => (
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
            )
          ) : null}
        </Panel>

        <Panel title={t('master.addTitle')}>
          <AddStockForm />
        </Panel>
      </div>
    </section>
  );
}
