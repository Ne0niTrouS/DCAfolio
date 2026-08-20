import { APP_NAME, todayIsoDate } from '@dcafolio/shared';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { LanguageSelector } from '@/components/LanguageSelector';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';
import { useStocks } from '@/features/transactions/queries';
import type { TranslationKey } from '@/i18n/en';
import { useLanguage } from '@/i18n/use-language';

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
      <path
        d="M3 3h6v7H3zM11 3h6v4h-6zM11 10h6v7h-6zM3 13h6v4H3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 6v4.2l2.8 1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
      <path
        d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M3.5 12.5v3a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS: { to: string; key: TranslationKey; icon: () => ReactNode }[] = [
  { to: '/', key: 'common.dashboard', icon: DashboardIcon },
  { to: '/history', key: 'common.history', icon: HistoryIcon },
  { to: '/export', key: 'common.export', icon: ExportIcon },
];

/** The navbar names the screen you are on; a stock detail page names the stock. */
function usePageTitle(): string {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  if (pathname.startsWith('/stocks/')) return decodeURIComponent(pathname.split('/')[2] ?? '');
  const match = NAV_ITEMS.find((item) => item.to === pathname);
  return match ? t(match.key) : APP_NAME;
}

function sidebarLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-nav-active text-white'
      : 'text-nav-ink-muted hover:bg-nav-hover hover:text-white'
  }`;
}

/**
 * Desktop: dark sidebar + dark navbar + light content. Mobile: dark header +
 * content + dark bottom navigation. Adding a purchase is reachable from every
 * screen, because recording one in under 30 seconds is the product's main job.
 */
export function AppShell() {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const { data: stocks = [] } = useStocks();
  const [signOutError, setSignOutError] = useState<TranslationKey | null>(null);
  const [adding, setAdding] = useState(false);
  const pageTitle = usePageTitle();

  async function handleSignOut() {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(mapAuthError(error));
    }
  }

  return (
    <div className="min-h-dvh bg-surface md:flex">
      {/* Lets a keyboard user reach the page without tabbing the whole nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-ink"
      >
        {t('common.skipToContent')}
      </a>

      <aside className="hidden w-60 shrink-0 flex-col bg-nav p-4 md:flex">
        <div className="px-3 py-2">
          <span className="text-lg font-semibold tracking-tight text-white">{APP_NAME}</span>
          <p className="text-xs text-nav-ink-muted">{t('common.appSubtitle')}</p>
        </div>

        <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={sidebarLinkClass}
            >
              <item.icon />
              {t(item.key)}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          {t('common.addPurchase')}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-medium text-nav-ink transition-colors hover:bg-nav-hover hover:text-white"
        >
          {t('common.logout')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-nav px-4 py-3 md:px-8">
          <div className="min-w-0">
            <span className="text-base font-semibold text-white md:text-lg">{pageTitle}</span>
            {user?.email ? (
              <p className="hidden truncate text-xs text-nav-ink-muted md:block">
                {user.email}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3 text-sm font-medium text-nav-ink transition-colors hover:bg-nav-hover hover:text-white md:hidden"
            >
              {t('common.logout')}
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10">
          {signOutError ? <p role="alert">{t(signOutError)}</p> : null}
          <Outlet />
        </main>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="fixed bottom-20 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-accent-strong md:hidden"
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          {t('common.addPurchase')}
        </button>

        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 bg-nav md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-nav-ink-muted'
                }`
              }
            >
              <item.icon />
              {t(item.key)}
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
