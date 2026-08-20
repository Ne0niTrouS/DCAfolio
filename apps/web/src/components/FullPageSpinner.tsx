/** Shown while the auth session resolves, so no page content flashes first. */
export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="size-6 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
