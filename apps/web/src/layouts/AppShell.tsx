import { APP_NAME, todayIsoDate } from '@dcafolio/shared';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { Button } from '@/components/Button';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';
import { useStocks } from '@/features/transactions/queries';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/history', label: 'History' },
  { to: '/export', label: 'Export' },
] as const;

function navClass({ isActive }: { isActive: boolean }): string {
  return `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-surface-sunken text-ink' : 'text-ink-muted hover:text-ink'
  }`;
}

/**
 * Desktop: sidebar + main content. Mobile: top header + content + bottom
 * navigation. Adding a purchase is reachable from every screen, because
 * recording one in under 30 seconds is the product's main job.
 */
export function AppShell() {
  const { signOut } = useAuth();
  const { data: stocks = [] } = useStocks();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleSignOut() {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(mapAuthError(error));
    }
  }

  return (
    <div className="min-h-dvh md:flex">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3 md:hidden">
        <span className="text-lg font-semibold text-ink">{APP_NAME}</span>
        <Button variant="secondary" onClick={handleSignOut} className="px-3">
          Logout
        </Button>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border-subtle p-4 md:flex">
        <span className="px-3 text-lg font-semibold text-ink">{APP_NAME}</span>
        <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button className="mt-6" onClick={() => setAdding(true)}>
          Add Purchase
        </Button>
        <Button variant="secondary" onClick={handleSignOut} className="mt-auto">
          Logout
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">
          {signOutError ? <p role="alert">{signOutError}</p> : null}
          <Outlet />
        </main>

        <Button
          className="fixed bottom-20 right-4 shadow-lg md:hidden"
          onClick={() => setAdding(true)}
        >
          Add Purchase
        </Button>

        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 grid grid-cols-3 border-t border-border-subtle bg-surface-raised md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 items-center justify-center text-sm font-medium ${
                  isActive ? 'text-accent' : 'text-ink-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {adding ? (
        <TransactionDialog
          stocks={stocks}
          today={todayIsoDate()}
          onClose={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
