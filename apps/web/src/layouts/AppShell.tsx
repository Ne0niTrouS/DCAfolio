import { APP_CREDIT, APP_NAME } from '@dcafolio/shared';
import { useCallback, useRef, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { BrandMark, BrandWordmark } from '@/components/Brand';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  HomeIcon,
  ListIcon,
  LogoutIcon,
  MenuIcon,
} from '@/components/icons';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';
import { useAutoSyncOnLogin } from '@/features/market-data/use-auto-sync';
import type { TranslationKey } from '@/i18n/en';
import { useLanguage } from '@/i18n/use-language';
import { useDismiss } from '@/lib/use-dismiss';

const NAV_ITEMS: {
  to: string;
  key: TranslationKey;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { to: '/', key: 'common.dashboard', icon: HomeIcon },
  { to: '/history', key: 'common.history', icon: ClockIcon },
  { to: '/stocks', key: 'common.stocks', icon: ListIcon },
  { to: '/export', key: 'common.export', icon: DownloadIcon },
];

/** The navbar names the screen you are on; a stock detail page names the stock. */
function usePageTitle(): string {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  if (pathname.startsWith('/stocks/')) return decodeURIComponent(pathname.split('/')[2] ?? '');
  const match = NAV_ITEMS.find((item) => item.to === pathname);
  return match ? t(match.key) : APP_NAME;
}

/** "auttapon@example.com" → "AU". Never more than two characters. */
function initialsFor(email: string | null | undefined): string {
  const name = email?.split('@')[0] ?? '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}` : name.slice(0, 2);
  return letters.toUpperCase() || '?';
}

function sidebarLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-nav-active text-white shadow-[inset_2px_0_0_0_var(--color-accent-bright)]'
      : 'text-nav-ink-muted hover:bg-nav-hover hover:text-white'
  }`;
}

/** Signed-in identity plus the actions that belong to it. */
function AccountMenu({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useDismiss(open, containerRef, dismiss);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t('common.account')}: ${email ?? ''}`}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1.5 text-sm font-medium text-white transition-colors hover:bg-nav-hover sm:pr-3"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent-bright"
        >
          {initialsFor(email)}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{email}</span>
        <ChevronDownIcon
          className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('common.account')}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] min-w-56 overflow-hidden rounded-xl border border-border-subtle bg-surface-raised py-1 shadow-xl"
        >
          <p className="truncate px-3 py-2 text-xs text-ink-muted">{email}</p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              dismiss(false);
              onSignOut();
            }}
            className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-ink transition-colors hover:bg-surface-sunken"
          >
            <LogoutIcon className="size-4" />
            {t('common.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Dark sidebar, dark navbar, light workspace. On a phone the sidebar gives way
 * to a bottom bar.
 *
 * There is no global "add purchase" action. Recording a purchase belongs to
 * History, which is where the record being added to already lives; a button in
 * the chrome put it on the dashboard too, where the job is to report the
 * portfolio rather than to invite edits to it.
 */
export function AppShell() {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const [signOutError, setSignOutError] = useState<TranslationKey | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pageTitle = usePageTitle();

  // Once per sign-in, not once per visit to the dashboard: this shell stays
  // mounted while navigating, and the marker it keeps covers a page reload.
  useAutoSyncOnLogin();

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

      <aside
        className={`hidden shrink-0 flex-col bg-nav p-4 md:flex ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden p-0'}`}
      >
        <div className="flex items-center gap-2.5 px-2 py-2">
          <BrandMark className="size-7 text-accent-bright" />
          <BrandWordmark className="text-xl text-white" />
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
          onClick={handleSignOut}
          className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-nav-border px-4 text-sm font-medium text-nav-ink transition-colors hover:bg-nav-hover hover:text-white"
        >
          <LogoutIcon className="size-4.5" />
          {t('common.logout')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-nav px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              aria-label={t('common.toggleNavigation')}
              aria-expanded={sidebarOpen}
              className="hidden size-10 items-center justify-center rounded-xl text-nav-ink transition-colors hover:bg-nav-hover hover:text-white md:inline-flex"
            >
              <MenuIcon />
            </button>
            <span className="truncate text-base font-semibold text-white md:text-lg">
              {pageTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <AccountMenu email={user?.email ?? null} onSignOut={handleSignOut} />
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10">
          {signOutError ? <p role="alert">{t(signOutError)}</p> : null}
          <Outlet />
        </main>

        <footer className="px-4 pb-24 text-center text-xs text-ink-faint md:px-8 md:pb-6">
          {APP_NAME} © {APP_CREDIT} · {t('common.footerTagline')}
        </footer>

        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 bg-nav md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-accent-bright' : 'text-nav-ink-muted'
                }`
              }
            >
              <item.icon />
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </div>

    </div>
  );
}
