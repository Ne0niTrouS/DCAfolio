import type { ReactNode } from 'react';

import { useT } from '@/i18n/use-language';

import { Button } from './Button';

/** Every major page handles loading, empty and error explicitly. */

export function LoadingState({ label }: { label?: string }) {
  const t = useT();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label ?? t('common.loading')}</span>
      {[0, 1, 2].map((row) => (
        <div key={row} className="h-16 animate-pulse rounded-xl bg-surface-sunken" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-raised px-6 py-12 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const t = useT();

  return (
    <div
      role="alert"
      className="rounded-2xl border border-loss/30 bg-loss/5 px-6 py-8 text-center"
    >
      <p className="text-base font-semibold text-loss">{title ?? t('error.generic')}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {onRetry ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            {t('common.tryAgain')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
