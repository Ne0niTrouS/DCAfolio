import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { createSupabaseMock } from '@/test/supabase-mock';
import { phrase } from '@/test/i18n-harness';

// The app shell loads the stock master for the Add Purchase dialog; only that
// I/O boundary is mocked.
vi.mock('@/lib/supabase', () => ({ supabase: createSupabaseMock({ data: [] }).supabase }));

const { App } = await import('@/App');

describe('routing and route protection', () => {
  it('shows the auth loading state instead of flashing the login screen', () => {
    renderWithAuth(<App />, { auth: createAuthValue({ status: 'loading' }) });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: phrase('auth.login') }),
    ).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to the login screen', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'unauthenticated' }),
      initialEntries: ['/'],
    });

    expect(
      await screen.findByRole('button', { name: phrase('auth.login') }),
    ).toBeInTheDocument();
  });

  it('protects history, export and stock detail as well as the dashboard', async () => {
    for (const path of ['/history', '/export', '/stocks/CPALL']) {
      const { unmount } = renderWithAuth(<App />, {
        auth: createAuthValue({ status: 'unauthenticated' }),
        initialEntries: [path],
      });

      expect(
        await screen.findByRole('button', { name: phrase('auth.login') }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it('renders the app shell for an authenticated user', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: ['/'],
    });

    expect(
      await screen.findByRole('heading', { name: phrase('dashboard.title') }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
  });

  it('signs the user out from the app shell', async () => {
    const auth = createAuthValue({ status: 'authenticated' });
    renderWithAuth(<App />, { auth, initialEntries: ['/'] });

    const [logout] = await screen.findAllByRole('button', { name: phrase('common.logout') });
    await userEvent.click(logout!);

    expect(auth.signOut).toHaveBeenCalled();
  });

  it('keeps the login screen public', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'unauthenticated' }),
      initialEntries: ['/login'],
    });

    expect(
      await screen.findByRole('button', { name: phrase('auth.login') }),
    ).toBeInTheDocument();
  });

  it('sends a signed-in user away from the login screen', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: ['/login'],
    });

    expect(
      await screen.findByRole('heading', { name: phrase('dashboard.title') }),
    ).toBeInTheDocument();
  });

  it('shows a not-found page for an unknown path', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: ['/nope'],
    });

    expect(
      await screen.findByRole('heading', { name: phrase('common.notFoundTitle') }),
    ).toBeInTheDocument();
  });
});
