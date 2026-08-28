import type { ReactNode } from 'react';

import { useT } from '@/i18n/use-language';

/**
 * A placeholder block, shaped like the thing that will replace it.
 *
 * Decorative by construction: `SkeletonScreen` announces the wait once, in
 * words, so a screen reader hears "loading your portfolio" rather than a
 * hundred unlabelled boxes.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-surface-sunken ${className}`}
    />
  );
}

/**
 * Wraps a set of placeholders and says, once, what is being waited for.
 *
 * `aria-busy` is what tells assistive technology this region is mid-update; the
 * shapes inside are hidden from it entirely.
 */
export function SkeletonScreen({ label, children }: { label?: string; children: ReactNode }) {
  const t = useT();

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">{label ?? t('common.loading')}</span>
      {children}
    </div>
  );
}

/** A bordered card of placeholders, matching the real panels around it. */
export function SkeletonCard({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
