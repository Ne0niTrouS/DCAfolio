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
        className={`min-h-11 w-full rounded-lg border bg-surface-raised px-3 text-sm text-ink transition-colors focus:outline-none focus:ring-4 ${
          error
            ? 'border-loss focus:border-loss focus:ring-loss/15'
            : 'border-gray-300 focus:border-accent focus:ring-accent/15'
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
