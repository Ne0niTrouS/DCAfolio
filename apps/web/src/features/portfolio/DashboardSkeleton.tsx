import { Skeleton, SkeletonCard, SkeletonScreen } from '@/components/Skeleton';
import { useT } from '@/i18n/use-language';

/**
 * The dashboard's shape while its figures are still being fetched.
 *
 * Deliberately laid out like the real thing — the same card count, the same
 * grid, roughly the same block sizes — so nothing jumps when the data lands.
 * A generic spinner reserves no space, and the page rearranging itself under a
 * reader is worse than a moment of blank cards.
 *
 * It shows no numbers, not even zeroes. A placeholder shaped like a figure is
 * the one thing a loading state must never be.
 */
export function DashboardSkeleton() {
  const t = useT();

  return (
    <SkeletonScreen label={t('dashboard.loadingPortfolio')}>
      {/* Portfolio summary: four figures, then the comparison bar. */}
      <SkeletonCard className="sm:p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((figure) => (
            <div key={figure}>
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-9 rounded-xl" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="mt-3 h-7 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border-subtle pt-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
      </SkeletonCard>

      {/* Market data strip. */}
      <SkeletonCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-11 w-28 rounded-xl" />
      </SkeletonCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Allocation: the ring, then a row per holding. */}
        <SkeletonCard>
          <Skeleton className="h-4 w-40" />
          <div className="mt-4 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
            <Skeleton className="size-42 shrink-0 rounded-full" />
            <div className="w-full flex-1 space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonCard>

        {/* Invested over time. */}
        <SkeletonCard>
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-4 h-56 w-full rounded-xl" />
        </SkeletonCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <SkeletonCard>
          <Skeleton className="h-4 w-36" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-8 w-full" />
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard>
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-5 w-full" />
            ))}
          </div>
        </SkeletonCard>
      </div>
    </SkeletonScreen>
  );
}
