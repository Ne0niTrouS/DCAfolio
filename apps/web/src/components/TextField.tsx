import { useId, type InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
};

/** Green focus treatment throughout — the browser's default blue is never used. */
const FIELD_BASE =
  'min-h-11 w-full rounded-lg border bg-surface-raised px-3 text-sm text-ink transition-colors placeholder:text-ink-faint focus:outline-none focus:ring-4';

export function TextField({ label, error, hint, className = '', ...rest }: TextFieldProps) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`${FIELD_BASE} ${
          error
            ? 'border-loss focus:border-loss focus:ring-loss/15'
            : 'border-gray-300 focus:border-accent focus:ring-accent/15'
        } ${className}`}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
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
