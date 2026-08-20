import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';

import { createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { createSupabaseMock } from '@/test/supabase-mock';

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
      expect(within(navigation).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
      expect(within(navigation).getByRole('link', { name: 'History' })).toBeInTheDocument();
      expect(within(navigation).getByRole('link', { name: 'Export' })).toBeInTheDocument();
    }
  });

  it('marks the current route for assistive technology, not by colour alone', () => {
    render(['/history']);

    const [sidebar] = screen.getAllByRole('navigation', { name: 'Main' });
    expect(within(sidebar!).getByRole('link', { name: 'History' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(sidebar!).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('lets a keyboard user skip the navigation', () => {
    render();

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('reaches Add Purchase from any screen', async () => {
    render(['/export']);

    const [addPurchase] = screen.getAllByRole('button', { name: 'Add Purchase' });
    await userEvent.click(addPurchase!);

    expect(await screen.findByRole('dialog')).toHaveAccessibleName('Add Purchase');
  });

  it('closes the add dialog on Escape without leaving the page', async () => {
    render();

    const [addPurchase] = screen.getAllByRole('button', { name: 'Add Purchase' });
    await userEvent.click(addPurchase!);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('signs out from both layouts', async () => {
    const auth = createAuthValue({ status: 'authenticated' });
    renderWithAuth(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>,
      { auth, initialEntries: ['/'] },
    );

    const logoutButtons = screen.getAllByRole('button', { name: 'Logout' });
    expect(logoutButtons).toHaveLength(2);

    await userEvent.click(logoutButtons[0]!);
    expect(auth.signOut).toHaveBeenCalled();
  });
});
