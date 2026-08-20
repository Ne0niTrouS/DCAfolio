import type { ReactNode } from 'react';

/**
 * The signed-out surface: the same dark brand colour the sidebar and navbar use,
 * so login and the application read as one product rather than two designs.
 *
 * The glow is a single soft radial highlight — enough to lift the white card off
 * the background without decorating it.
 */
export function AuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-nav px-4 py-12 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_50%_-10%,rgba(22,163,74,0.22),transparent_70%),radial-gradient(40rem_30rem_at_110%_110%,rgba(31,41,55,0.9),transparent_60%)]"
      />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}

/** The white elevated card every signed-out screen sits in. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-raised p-6 shadow-2xl shadow-black/30 sm:p-8">
      {children}
    </div>
  );
}
