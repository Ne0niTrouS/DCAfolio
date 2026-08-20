import { useId, type ReactNode } from 'react';

/**
 * A white card with a heading, the workspace's main container.
 *
 * The heading is a real `h2` tied to the section by `aria-labelledby`, so the
 * page keeps a usable outline rather than a stack of anonymous boxes.
 */
export function Panel({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={headingId}
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink"
        >
          {icon ? <span className="text-accent">{icon}</span> : null}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
