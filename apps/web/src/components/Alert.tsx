import type { ReactNode } from 'react';

type AlertProps = {
  tone?: 'error' | 'info' | 'success';
  children: ReactNode;
};

const TONES: Record<NonNullable<AlertProps['tone']>, string> = {
  error: 'border-loss/40 bg-loss/5 text-loss',
  info: 'border-border-subtle bg-surface-sunken text-ink-muted',
  success: 'border-profit/40 bg-profit/5 text-profit',
};

/**
 * `role="alert"` so a screen reader announces the message the moment it
 * appears, rather than leaving the failure silent.
 */
export function Alert({ tone = 'error', children }: AlertProps) {
  return (
    <p role="alert" className={`rounded-lg border px-3 py-2 text-sm ${TONES[tone]}`}>
      {children}
    </p>
  );
}
