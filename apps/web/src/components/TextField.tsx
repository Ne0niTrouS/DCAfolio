import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  /** Rendered inside the field, before the input. Decorative. */
  icon?: ReactNode;
  /**
   * Hides the label visually while keeping it for assistive technology. Use it
   * only where a placeholder already carries the same words.
   */
  hideLabel?: boolean;
  /** `dark` styles the field for the signed-out brand surface. */
  tone?: 'light' | 'dark';
};

const TONES = {
  light: {
    label: 'text-ink',
    field: 'bg-surface-raised text-ink placeholder:text-ink-faint',
    icon: 'text-ink-faint',
    idle: 'border-gray-300 focus-within:border-accent focus-within:ring-accent/15',
    invalid: 'border-loss focus-within:border-loss focus-within:ring-loss/15',
    hint: 'text-ink-muted',
  },
  dark: {
    label: 'text-nav-ink',
    field: 'bg-white/[0.04] text-white placeholder:text-nav-ink-muted',
    icon: 'text-nav-ink-muted',
    idle: 'border-nav-border focus-within:border-accent-bright focus-within:ring-accent/25',
    invalid: 'border-loss focus-within:border-loss focus-within:ring-loss/25',
    hint: 'text-nav-ink-muted',
  },
} as const;

/** Green focus treatment throughout — the browser's default blue is never used. */
export function TextField({
  label,
  error,
  hint,
  icon,
  hideLabel = false,
  tone = 'light',
  className = '',
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');
  const palette = TONES[tone];

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : `text-sm font-medium ${palette.label}`}
      >
        {label}
      </label>

      <div
        className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3 transition-colors focus-within:ring-4 ${palette.field} ${
          error ? palette.invalid : palette.idle
        }`}
      >
        {icon ? <span className={palette.icon}>{icon}</span> : null}
        <input
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${className}`}
        />
      </div>

      {hint ? (
        <p id={hintId} className={`text-xs ${palette.hint}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}
