import { Skeleton, SkeletonCard, SkeletonScreen } from '@/components/Skeleton';
import { useT } from '@/i18n/use-language';

/**
 * The history table's shape while its rows are being fetched.
 *
 * Two shapes, matching the two the page actually renders: a table from `md` up
 * and cards below it. Showing the wrong one would move the content sideways the
 * moment the data lands, which is the jump a skeleton exists to prevent.
 */
export function HistorySkeleton() {
  const t = useT();

  return (
    <SkeletonScreen label={t('history.loadingTransactions')}>
      <SkeletonCard className="hidden overflow-hidden p-0 md:block">
        <div className="flex gap-4 border-b border-border-subtle px-4 py-3">
          {['w-20', 'w-16', 'w-28', 'w-20', 'w-24', 'w-20'].map((width) => (
            <Skeleton key={width} className={`h-3 ${width}`} />
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b border-border-subtle px-4 py-4 last:border-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </SkeletonCard>

      <div className="flex flex-col gap-3 md:hidden">
        {[0, 1, 2, 3].map((card) => (
          <SkeletonCard key={card}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="mt-3 h-4 w-32" />
            <Skeleton className="mt-2 h-4 w-24" />
          </SkeletonCard>
        ))}
      </div>
    </SkeletonScreen>
  );
}
