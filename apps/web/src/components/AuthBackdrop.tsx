import type { ReactNode } from 'react';

/**
 * The signed-out surface: the same near-black brand colour the sidebar and
 * navbar use, so login and the application read as one product.
 *
 * The scenery is a few large soft shapes, two thin light streaks and a faint
 * dotted grid. All of it is `aria-hidden` and `pointer-events-none` — it exists
 * to give the card somewhere to sit, and nothing more.
 */
function Scenery() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft green glow, top-left, and a cooler one bottom-right. */}
      <div className="absolute -left-40 -top-52 size-[34rem] rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-56 -right-32 size-[36rem] rounded-full bg-accent/12 blur-3xl" />

      {/* Large rounded panels, barely lighter than the background. */}
      <div className="absolute -right-24 -top-24 size-96 rotate-12 rounded-[4rem] bg-white/[0.02]" />
      <div className="absolute -bottom-32 -left-28 size-[26rem] -rotate-12 rounded-[4rem] bg-white/[0.02]" />

      {/* Thin diagonal light streaks. */}
      <div className="absolute left-[14%] top-[24%] h-64 w-px rotate-45 bg-gradient-to-b from-transparent via-accent-bright/40 to-transparent" />
      <div className="absolute right-[16%] top-[40%] h-72 w-px rotate-45 bg-gradient-to-b from-transparent via-accent-bright/30 to-transparent" />

      {/* Dotted grids in opposite corners. */}
      <div className="dot-grid absolute right-16 top-16 h-24 w-32 opacity-60" />
      <div className="dot-grid absolute bottom-16 left-16 h-24 w-32 opacity-40" />
    </div>
  );
}

export function AuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-nav-deep px-4 py-12 sm:px-6">
      <Scenery />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}

/**
 * The elevated card every signed-out screen sits in: dark glass against the
 * dark backdrop, lifted by a hairline border rather than a colour change.
 */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-nav-border bg-nav-card/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">
      {children}
    </div>
  );
}
