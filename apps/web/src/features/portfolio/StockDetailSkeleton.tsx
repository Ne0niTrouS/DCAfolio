import { Skeleton, SkeletonCard, SkeletonScreen } from '@/components/Skeleton';
import { useT } from '@/i18n/use-language';

/**
 * One stock's page while its figures are being fetched.
 *
 * The heading is a placeholder too: the symbol is known from the URL, but
 * printing it over blank figures would suggest the rest had loaded.
 */
export function StockDetailSkeleton({ symbol }: { symbol: string }) {
  const t = useT();

  return (
    <SkeletonScreen label={t('stock.loading', { symbol })}>
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((figure) => (
          <SkeletonCard key={figure} className="px-4 py-3.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-5 w-28" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard>
        <Skeleton className="h-4 w-36" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-8 w-full" />
          ))}
        </div>
      </SkeletonCard>
    </SkeletonScreen>
  );
}
