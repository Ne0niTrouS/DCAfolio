import { todayIsoDate, type Stock, type TransactionWithStock } from '@dcafolio/shared';
import { useMemo, useState } from 'react';

import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { DeleteTransactionDialog } from '@/features/transactions/DeleteTransactionDialog';
import { HistoryFilters } from '@/features/transactions/HistoryFilters';
import { TransactionCard } from '@/features/transactions/TransactionCard';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';
import { TransactionTable } from '@/features/transactions/TransactionTable';
import { useStocks, useTransactions } from '@/features/transactions/queries';
import { useTransactionHistory } from '@/features/transactions/use-transaction-history';
import { useT } from '@/i18n/use-language';
import { mapDataError } from '@/lib/errors';

/** The stock filter lists only stocks the user owns. */
function ownedStocks(transactions: TransactionWithStock[]): Stock[] {
  const owned = new Map<string, Stock>();
  for (const transaction of transactions) {
    owned.set(transaction.stockId, transaction.stock);
  }
  return [...owned.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function HistoryPage() {
  const t = useT();
  const history = useTransactionHistory();
  const allTransactions = useTransactions();
  const { data: stocks = [] } = useStocks();

  const [editing, setEditing] = useState<TransactionWithStock | null>(null);
  const [deleting, setDeleting] = useState<TransactionWithStock | null>(null);
  const [adding, setAdding] = useState(false);

  const filterStocks = useMemo(
    () => ownedStocks(allTransactions.data ?? []),
    [allTransactions.data],
  );

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">{t('history.title')}</h1>

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm">
        <HistoryFilters
          filters={history.filters}
          stocks={filterStocks}
          hasFilters={history.hasFilters}
          onChange={history.setFilters}
          onClear={history.clearFilters}
        />
      </div>

      {history.isLoading ? <LoadingState label={t('history.loadingTransactions')} /> : null}

      {!history.isLoading && history.error ? (
        <ErrorState
          title={t('history.loadError')}
          description={t(mapDataError(history.error))}
          onRetry={() => void history.refetch()}
        />
      ) : null}

      {!history.isLoading && !history.error && history.isEmpty ? (
        <EmptyState
          title={t('history.emptyTitle')}
          description={t('dashboard.emptyBody')}
          action={<Button onClick={() => setAdding(true)}>{t('common.addPurchase')}</Button>}
        />
      ) : null}

      {!history.isLoading && !history.error && history.hasNoMatches ? (
        <EmptyState
          title={t('history.noMatches')}
          action={
            <Button variant="secondary" onClick={history.clearFilters}>
              {t('history.clearFilters')}
            </Button>
          }
        />
      ) : null}

      {!history.isLoading && !history.error && history.transactions.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised shadow-sm md:block">
            <TransactionTable
              transactions={history.transactions}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {history.transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
        </>
      ) : null}

      {adding || editing ? (
        <TransactionDialog
          stocks={stocks}
          transaction={editing ?? undefined}
          today={todayIsoDate()}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      ) : null}

      {deleting ? (
        <DeleteTransactionDialog transaction={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </section>
  );
}
