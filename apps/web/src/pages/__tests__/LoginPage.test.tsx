import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from '@/pages/LoginPage';
import { createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { phrase } from '@/test/i18n-harness';

const EMAIL = phrase('auth.email');
const PASSWORD = phrase('auth.password');
const LOGIN = phrase('auth.login');

describe('LoginPage', () => {
  it('shows the product identity and the NeOniTrouS credit', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'DCAfolio' })).toBeInTheDocument();
    expect(screen.getByText(phrase('common.appSubtitle'))).toBeInTheDocument();
    expect(screen.getByText('© NeOniTrouS')).toBeInTheDocument();
  });

  it('offers only email, password, login and the language selector', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByLabelText(EMAIL)).toBeInTheDocument();
    expect(screen.getByLabelText(PASSWORD)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: LOGIN })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `${phrase('common.language')}: ไทย` }),
    ).toBeInTheDocument();

    // No forgot-password link, no social sign-in, no marketing copy.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('rejects an invalid email without calling Supabase', async () => {
    const auth = createAuthValue();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), 'not-an-email');
    await userEvent.type(screen.getByLabelText(PASSWORD), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: LOGIN }));

    expect(screen.getByText(phrase('auth.invalidEmail'))).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('requires a password', async () => {
    const auth = createAuthValue();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), 'owner@example.com');
    await userEvent.click(screen.getByRole('button', { name: LOGIN }));

    expect(screen.getByText(phrase('auth.passwordRequired'))).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email and the password', async () => {
    const auth = createAuthValue();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), '  owner@example.com  ');
    await userEvent.type(screen.getByLabelText(PASSWORD), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: LOGIN }));

    await waitFor(() => {
      expect(auth.signIn).toHaveBeenCalledWith('owner@example.com', 'correct horse');
    });
  });

  it('surfaces a human-readable message when sign-in fails', async () => {
    const auth = createAuthValue({
      signIn: vi.fn(async () => {
        throw new Error('Invalid login credentials');
      }),
    });
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), 'owner@example.com');
    await userEvent.type(screen.getByLabelText(PASSWORD), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: LOGIN }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      phrase('error.invalidCredentials'),
    );
  });

  it('disables the button while the request is in flight', async () => {
    let release = () => {};
    const auth = createAuthValue({
      signIn: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      ),
    });
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), 'owner@example.com');
    await userEvent.type(screen.getByLabelText(PASSWORD), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: LOGIN }));

    const button = await screen.findByRole('button', { name: phrase('common.working') });
    expect(button).toBeDisabled();

    release();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: LOGIN })).toBeEnabled();
    });
  });
});
