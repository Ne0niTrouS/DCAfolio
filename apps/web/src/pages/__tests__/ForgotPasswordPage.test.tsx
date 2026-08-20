import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { createAuthValue, renderWithAuth } from '@/test/auth-harness';

describe('ForgotPasswordPage', () => {
  it('requests a reset link for a valid address', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ForgotPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText('Email'), 'owner@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(auth.requestPasswordReset).toHaveBeenCalledWith('owner@example.com');
  });

  it('confirms neutrally so it never discloses whether an account exists', async () => {
    renderWithAuth(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'stranger@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'If an account exists for that address, a reset link has been sent.',
    );
  });

  it('rejects an invalid address without calling Supabase', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ForgotPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText('Email'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe('ResetPasswordPage', () => {
  it('rejects a short password', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText('New password'), 'short');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText('New password'), 'correct horse');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'battery staple');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the password when both fields match', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText('New password'), 'correct horse');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(auth.updatePassword).toHaveBeenCalledWith('correct horse');
  });

  it('explains an expired recovery link instead of showing the raw error', async () => {
    const auth = createAuthValue({
      updatePassword: vi.fn(async () => {
        throw new Error('Token has expired or is invalid');
      }),
    });
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText('New password'), 'correct horse');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This link is no longer valid. Request a new password reset email.',
    );
  });
});
