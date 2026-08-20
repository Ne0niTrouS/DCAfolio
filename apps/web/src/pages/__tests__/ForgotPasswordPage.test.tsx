import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { createAuthValue, renderWithAuth } from '@/test/auth-harness';
import { phrase } from '@/test/i18n-harness';

const EMAIL = phrase('auth.email');
const SEND_RESET = phrase('auth.sendResetLink');
const NEW_PASSWORD = phrase('auth.newPassword');
const CONFIRM_PASSWORD = phrase('auth.confirmNewPassword');
const UPDATE_PASSWORD = phrase('auth.updatePassword');

describe('ForgotPasswordPage', () => {
  it('requests a reset link for a valid address', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ForgotPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), 'owner@example.com');
    await userEvent.click(screen.getByRole('button', { name: SEND_RESET }));

    expect(auth.requestPasswordReset).toHaveBeenCalledWith('owner@example.com');
  });

  it('confirms neutrally so it never discloses whether an account exists', async () => {
    renderWithAuth(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText(EMAIL), 'stranger@example.com');
    await userEvent.click(screen.getByRole('button', { name: SEND_RESET }));

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('auth.resetSent'));
  });

  it('rejects an invalid address without calling Supabase', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ForgotPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText(EMAIL), 'nope');
    await userEvent.click(screen.getByRole('button', { name: SEND_RESET }));

    expect(screen.getByText(phrase('auth.invalidEmail'))).toBeInTheDocument();
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe('ResetPasswordPage', () => {
  it('rejects a short password', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText(NEW_PASSWORD), 'short');
    await userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), 'short');
    await userEvent.click(screen.getByRole('button', { name: UPDATE_PASSWORD }));

    expect(screen.getByText(phrase('auth.passwordTooShort', { count: 8 }))).toBeInTheDocument();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects a mismatched confirmation', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText(NEW_PASSWORD), 'correct horse');
    await userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), 'battery staple');
    await userEvent.click(screen.getByRole('button', { name: UPDATE_PASSWORD }));

    expect(screen.getByText(phrase('auth.passwordsDoNotMatch'))).toBeInTheDocument();
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the password when both fields match', async () => {
    const auth = createAuthValue();
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText(NEW_PASSWORD), 'correct horse');
    await userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: UPDATE_PASSWORD }));

    expect(auth.updatePassword).toHaveBeenCalledWith('correct horse');
  });

  it('explains an expired recovery link instead of showing the raw error', async () => {
    const auth = createAuthValue({
      updatePassword: vi.fn(async () => {
        throw new Error('Token has expired or is invalid');
      }),
    });
    renderWithAuth(<ResetPasswordPage />, { auth });

    await userEvent.type(screen.getByLabelText(NEW_PASSWORD), 'correct horse');
    await userEvent.type(screen.getByLabelText(CONFIRM_PASSWORD), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: UPDATE_PASSWORD }));

    expect(await screen.findByRole('alert')).toHaveTextContent(phrase('error.linkExpired'));
  });
});
