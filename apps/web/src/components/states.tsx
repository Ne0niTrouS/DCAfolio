import type { ReactNode } from 'react';

import { Button } from './Button';

/** Every major page handles loading, empty and error explicitly. */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
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
    <div className="rounded-xl border border-dashed border-border-subtle px-6 py-10 text-center">
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong.',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-loss/40 bg-loss/5 px-6 py-8 text-center"
    >
      <p className="text-base font-medium text-loss">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {onRetry ? (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
