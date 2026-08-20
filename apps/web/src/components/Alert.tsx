import type { ReactNode } from 'react';

type AlertProps = {
  tone?: 'error' | 'info' | 'success';
  /** `dark` keeps the message legible on the signed-out brand surface. */
  surface?: 'light' | 'dark';
  children: ReactNode;
};

const LIGHT: Record<NonNullable<AlertProps['tone']>, string> = {
  error: 'border-loss/30 bg-loss/5 text-loss',
  info: 'border-border-subtle bg-surface-sunken text-ink-muted',
  success: 'border-accent/30 bg-accent-subtle text-accent-strong',
};

const DARK: Record<NonNullable<AlertProps['tone']>, string> = {
  error: 'border-loss/40 bg-loss/15 text-red-300',
  info: 'border-nav-border bg-white/5 text-nav-ink-muted',
  success: 'border-accent/40 bg-accent/15 text-accent-bright',
};

/**
 * `role="alert"` so a screen reader announces the message the moment it
 * appears, rather than leaving the failure silent.
 */
export function Alert({ tone = 'error', surface = 'light', children }: AlertProps) {
  const palette = surface === 'dark' ? DARK : LIGHT;

  return (
    <p role="alert" className={`rounded-xl border px-3 py-2.5 text-sm ${palette[tone]}`}>
      {children}
    </p>
  );
}
