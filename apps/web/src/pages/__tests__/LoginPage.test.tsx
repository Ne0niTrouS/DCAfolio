import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LoginPage } from '@/pages/LoginPage';
import { createAuthValue, renderWithAuth } from '@/test/auth-harness';

describe('LoginPage', () => {
  it('shows the product identity and the NeOniTrouS credit', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'DCAfolio' })).toBeInTheDocument();
    expect(screen.getByText('Personal Stock Tracker')).toBeInTheDocument();
    expect(screen.getByText('© NeOniTrouS')).toBeInTheDocument();
  });

  it('offers email, password, login and a forgot-password link', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot Password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('rejects an invalid email without calling Supabase', async () => {
    const auth = createAuthValue();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('requires a password', async () => {
    const auth = createAuthValue();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email and the password', async () => {
    const auth = createAuthValue();
    renderWithAuth(<LoginPage />, { auth });

    await userEvent.type(screen.getByLabelText('Email'), '  owner@example.com  ');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

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

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
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

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    const button = await screen.findByRole('button', { name: 'Working…' });
    expect(button).toBeDisabled();

    release();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled();
    });
  });
});
