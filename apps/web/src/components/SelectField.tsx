import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string | undefined;
  children: ReactNode;
};

export function SelectField({
  label,
  error,
  className = '',
  children,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-11 rounded-lg border bg-surface-raised px-3 text-sm text-ink ${
          error ? 'border-loss' : 'border-border-subtle'
        } ${className}`}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="text-xs text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}
