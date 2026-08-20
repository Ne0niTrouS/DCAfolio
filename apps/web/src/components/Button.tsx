import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  pending?: boolean;
  children: ReactNode;
};

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'bg-surface-raised text-ink border border-border-subtle hover:bg-surface-sunken',
  danger: 'bg-loss text-white hover:opacity-90',
};

/** Touch targets are at least 44px tall so the app stays usable on a phone. */
export function Button({
  variant = 'primary',
  pending = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
