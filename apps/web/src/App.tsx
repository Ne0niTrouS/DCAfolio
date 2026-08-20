import { APP_CREDIT, APP_NAME, APP_SUBTITLE } from '@dcafolio/shared';

/**
 * Phase 1 application shell. Routing, authentication and the real pages arrive
 * in Phase 3 — see docs/plans/implementation-plan.md.
 */
export function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-ink-muted">{APP_SUBTITLE}</p>
        <p className="mt-8 rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 text-sm text-ink-muted">
          Project foundation ready. Authentication lands in Phase 3.
        </p>
        <p className="mt-8 text-xs text-ink-muted">© {APP_CREDIT}</p>
      </div>
    </main>
  );
}
