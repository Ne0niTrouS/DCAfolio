import type { ReactNode } from 'react';

type AlertProps = {
  tone?: 'error' | 'info' | 'success';
  children: ReactNode;
};

const TONES: Record<NonNullable<AlertProps['tone']>, string> = {
  error: 'border-loss/30 bg-loss/5 text-loss',
  info: 'border-border-subtle bg-surface-sunken text-ink-muted',
  success: 'border-accent/30 bg-accent-subtle text-accent-strong',
};

/**
 * `role="alert"` so a screen reader announces the message the moment it
 * appears, rather than leaving the failure silent.
 */
export function Alert({ tone = 'error', children }: AlertProps) {
  return (
    <p role="alert" className={`rounded-lg border px-3 py-2.5 text-sm ${TONES[tone]}`}>
      {children}
    </p>
  );
}
