import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { en } from '@/i18n/en';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { DEFAULT_LANGUAGE, LANGUAGE_LABEL } from '@/i18n/language-context';
import { th } from '@/i18n/th';
import { translate } from '@/i18n/translate';
import { AuthHarness, createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { createSupabaseMock } from '@/test/supabase-mock';

vi.mock('@/lib/supabase', () => ({ supabase: createSupabaseMock({ data: [] }).supabase }));

const { App } = await import('@/App');

const THAI_BUTTON = new RegExp(`${th['common.language']}: ${LANGUAGE_LABEL.th}`);
const ENGLISH_BUTTON = new RegExp(`${en['common.language']}: ${LANGUAGE_LABEL.en}`);

function openMenu() {
  return userEvent.click(screen.getByRole('button', { name: THAI_BUTTON }));
}

describe('dictionaries', () => {
  it('covers the same keys in both languages', () => {
    expect(Object.keys(th).sort()).toEqual(Object.keys(en).sort());
  });

  it('leaves no phrase empty or accidentally left in English', () => {
    for (const [key, value] of Object.entries(th)) {
      expect(value.trim(), key).not.toBe('');
      // A handful legitimately match: a ticker, a Thai company name used as an
      // example, and labels built from product names rather than words.
      const SAME_IN_BOTH = [
        'common.language',
        // Product words the owner chose to keep in English on both sides.
        'common.dashboard',
        'dashboard.title',
        'dashboard.dcaPerMonth',
        'market.sync',
        'master.symbolPlaceholder',
        'master.nameThPlaceholder',
      ];
      if (SAME_IN_BOTH.includes(key)) continue;
      expect(value, key).not.toBe(en[key as keyof typeof en]);
    }
  });

  it('really is Thai, not a placeholder', () => {
    expect(th['auth.email']).toBe('อีเมล');
    expect(th['auth.password']).toBe('รหัสผ่าน');
    expect(th['auth.login']).toBe('เข้าสู่ระบบ');
    expect(th['dashboard.portfolioValue']).toBe('มูลค่าพอร์ต');
    expect(th['dashboard.totalInvested']).toBe('เงินลงทุนทั้งหมด');
    expect(th['common.addPurchase']).toBe('เพิ่มรายการซื้อ');
    expect(th['common.logout']).toBe('ออกจากระบบ');
  });

  it('substitutes placeholders and leaves unknown ones alone', () => {
    expect(translate('en', 'history.editRow', { symbol: 'CPALL', date: '09/08/2026' })).toBe(
      'Edit CPALL on 09/08/2026',
    );
    expect(translate('th', 'purchase.perShare', { value: '฿62.50' })).toBe('฿62.50/หุ้น');
    expect(translate('en', 'market.source')).toBe('Source: {source}');
  });
});

describe('language selector', () => {
  it('opens the login screen in Thai regardless of anything remembered', () => {
    expect(DEFAULT_LANGUAGE).toBe('th');

    renderWithAuth(<App />, {
      auth: createAuthValue({ status: 'unauthenticated' }),
      initialEntries: ['/login'],
    });

    expect(screen.getByLabelText(th['auth.email'])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: THAI_BUTTON })).toBeInTheDocument();
  });

  it('offers exactly two options and marks the active one', async () => {
    renderWithAuth(
      <LanguageProvider>
        <App />
      </LanguageProvider>,
      { auth: createAuthValue({ status: 'unauthenticated' }), initialEntries: ['/login'] },
    );

    await openMenu();

    const menu = screen.getByRole('menu');
    const options = within(menu).getAllByRole('menuitemradio');

    expect(options).toHaveLength(2);
    expect(
      within(menu).getByRole('menuitemradio', { name: LANGUAGE_LABEL.th }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      within(menu).getByRole('menuitemradio', { name: LANGUAGE_LABEL.en }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  it('switches the login screen to English and back', async () => {
    renderWithAuth(
      <LanguageProvider>
        <App />
      </LanguageProvider>,
      { auth: createAuthValue({ status: 'unauthenticated' }), initialEntries: ['/login'] },
    );

    await openMenu();
    await userEvent.click(screen.getByRole('menuitemradio', { name: /English/ }));

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ENGLISH_BUTTON })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: ENGLISH_BUTTON }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /ไทย/ }));

    expect(screen.getByLabelText(th['auth.email'])).toBeInTheDocument();
  });

  it('closes on Escape and on a click outside', async () => {
    renderWithAuth(
      <LanguageProvider>
        <App />
      </LanguageProvider>,
      { auth: createAuthValue({ status: 'unauthenticated' }), initialEntries: ['/login'] },
    );

    await openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    await openMenu();
    await userEvent.click(screen.getByLabelText(th['auth.email']));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});

describe('language across the signed-in application', () => {
  function renderApp(path = '/') {
    return renderWithAuth(
      <LanguageProvider>
        <App />
      </LanguageProvider>,
      { auth: createAuthValue({ status: 'authenticated' }), initialEntries: [path] },
    );
  }

  async function switchToEnglish() {
    await userEvent.click(screen.getByRole('button', { name: THAI_BUTTON }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: /English/ }));
  }

  it('starts the dashboard in Thai', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', { name: th['dashboard.title'] }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: th['common.history'] }).length).toBeGreaterThan(
      0,
    );
  });

  it('switches every visible label, and keeps the choice while navigating', async () => {
    renderApp();
    await screen.findByRole('heading', { name: th['dashboard.title'] });

    await switchToEnglish();

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    const [sidebar] = screen.getAllByRole('navigation', { name: 'Main' });

    await userEvent.click(within(sidebar!).getByRole('link', { name: 'History' }));
    expect(await screen.findByRole('heading', { name: 'History' })).toBeInTheDocument();

    await userEvent.click(within(sidebar!).getByRole('link', { name: 'Export' }));
    expect(await screen.findByRole('heading', { name: 'Export Data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ENGLISH_BUTTON })).toBeInTheDocument();
  });

  it('opens the Add Purchase modal in the application language', async () => {
    renderApp('/history');
    await screen.findByRole('heading', { name: th['history.title'] });

    await switchToEnglish();
    const [addPurchase] = screen.getAllByRole('button', { name: 'Add Purchase' });
    await userEvent.click(addPurchase!);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Add Purchase');
    expect(within(dialog).getByLabelText('Purchase Date')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Shares Received')).toBeInTheDocument();
  });

  it('returns to Thai when the session ends', async () => {
    function tree(status: 'authenticated' | 'unauthenticated') {
      return (
        <AuthHarness auth={createAuthValue({ status })}>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </AuthHarness>
      );
    }

    const { rerender } = render(tree('authenticated'));

    await screen.findByRole('heading', { name: th['dashboard.title'] });
    await switchToEnglish();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

    // Signing out flips the auth status, which resets the language.
    rerender(tree('unauthenticated'));

    expect(await screen.findByLabelText(th['auth.email'])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: THAI_BUTTON })).toBeInTheDocument();
  });
});
