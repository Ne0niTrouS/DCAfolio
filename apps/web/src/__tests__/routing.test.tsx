import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '@/App';
import { createAuthValue, renderWithAuth } from '@/test/auth-harness';

describe('routing and route protection', () => {
  it('shows the auth loading state instead of flashing the login screen', () => {
    renderWithAuth(<App />, { auth: createAuthValue({ status: 'loading' }) });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to the login screen', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'unauthenticated' }),
      initialEntries: ['/'],
    });

    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('protects history, export and stock detail as well as the dashboard', async () => {
    for (const path of ['/history', '/export', '/stocks/CPALL']) {
      const { unmount } = renderWithAuth(<App />, {
        auth: createAuthValue({ status: 'unauthenticated' }),
        initialEntries: [path],
      });

      expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
      unmount();
    }
  });

  it('renders the app shell for an authenticated user', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: ['/'],
    });

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
  });

  it('signs the user out from the app shell', async () => {
    const auth = createAuthValue({ status: 'authenticated' });
    renderWithAuth(<App />, { auth, initialEntries: ['/'] });

    const [logout] = await screen.findAllByRole('button', { name: 'Logout' });
    await userEvent.click(logout!);

    expect(auth.signOut).toHaveBeenCalled();
  });

  it('keeps the login screen public', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'unauthenticated' }),
      initialEntries: ['/login'],
    });

    expect(await screen.findByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('sends a signed-in user away from the login screen', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: ['/login'],
    });

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows a not-found page for an unknown path', async () => {
    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'authenticated' }),
      initialEntries: ['/nope'],
    });

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
