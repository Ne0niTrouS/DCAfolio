import { Skeleton, SkeletonScreen } from '@/components/Skeleton';
import { useT } from '@/i18n/use-language';

/**
 * Rows of the stock register while the list is being fetched.
 *
 * Sits inside the panel that is already on screen, so only the rows are
 * standing in — the heading, the count and the search box are real and usable
 * the whole time.
 */
export function StockMasterSkeleton({ rows = 8 }: { rows?: number }) {
  const t = useT();

  return (
    <SkeletonScreen label={t('common.loading')}>
      <div className="flex flex-col divide-y divide-border-subtle">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-baseline justify-between gap-4 py-2.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-64 max-w-[60%]" />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  );
}
