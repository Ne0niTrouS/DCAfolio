import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import type { AuthContextValue } from '@/features/auth/auth-context';
import { createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { createSupabaseMock } from '@/test/supabase-mock';
import { phrase } from '@/test/i18n-harness';

vi.mock('@/lib/supabase', () => ({ supabase: createSupabaseMock({ data: [] }).supabase }));

const { AppShell } = await import('@/layouts/AppShell');

function render(initialEntries = ['/']) {
  return renderWithAuth(
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<p>Dashboard content</p>} />
        <Route path="/history" element={<p>History content</p>} />
        <Route path="/export" element={<p>Export content</p>} />
      </Route>
    </Routes>,
    { auth: createAuthValue({ status: 'authenticated' }), initialEntries },
  );
}

describe('AppShell', () => {
  it('offers both the desktop sidebar and the mobile bottom navigation', () => {
    render();

    const navigations = screen.getAllByRole('navigation', { name: 'Main' });
    expect(navigations).toHaveLength(2);

    for (const navigation of navigations) {
      expect(
        within(navigation).getByRole('link', { name: phrase('common.dashboard') }),
      ).toBeInTheDocument();
      expect(
        within(navigation).getByRole('link', { name: phrase('common.history') }),
      ).toBeInTheDocument();
      expect(
        within(navigation).getByRole('link', { name: phrase('common.export') }),
      ).toBeInTheDocument();
    }
  });

  it('marks the current route for assistive technology, not by colour alone', () => {
    render(['/history']);

    const [sidebar] = screen.getAllByRole('navigation', { name: 'Main' });
    expect(
      within(sidebar!).getByRole('link', { name: phrase('common.history') }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(sidebar!).getByRole('link', { name: phrase('common.dashboard') }),
    ).not.toHaveAttribute('aria-current');
  });

  it('lets a keyboard user skip the navigation', () => {
    render();

    expect(screen.getByRole('link', { name: phrase('common.skipToContent') })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('reaches Add Purchase from any screen', async () => {
    render(['/export']);

    const [addPurchase] = screen.getAllByRole('button', { name: phrase('common.addPurchase') });
    await userEvent.click(addPurchase!);

    expect(await screen.findByRole('dialog')).toHaveAccessibleName(phrase('purchase.addTitle'));
  });

  it('closes the add dialog on Escape without leaving the page', async () => {
    render();

    const [addPurchase] = screen.getAllByRole('button', { name: phrase('common.addPurchase') });
    await userEvent.click(addPurchase!);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('signs out from the sidebar', async () => {
    const auth = createAuthValue({ status: 'authenticated' });
    renderWithAuth(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>,
      { auth, initialEntries: ['/'] },
    );

    const logoutButtons = screen.getAllByRole('button', { name: phrase('common.logout') });
    expect(logoutButtons).toHaveLength(1);

    await userEvent.click(logoutButtons[0]!);
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('signs out from the account menu, which is the only route on a phone', async () => {
    const auth = createAuthValue({
      status: 'authenticated',
      user: { email: 'owner@example.com' } as AuthContextValue['user'],
    });
    renderWithAuth(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>,
      { auth, initialEntries: ['/'] },
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: `${phrase('common.account')}: owner@example.com`,
      }),
    );

    const menu = screen.getByRole('menu', { name: phrase('common.account') });
    await userEvent.click(
      within(menu).getByRole('menuitem', { name: phrase('common.logout') }),
    );

    expect(auth.signOut).toHaveBeenCalled();
  });

  it('collapses and restores the sidebar', async () => {
    render();

    const toggle = screen.getByRole('button', { name: phrase('common.toggleNavigation') });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
