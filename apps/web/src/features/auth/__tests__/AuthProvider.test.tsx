import type { Session } from '@supabase/supabase-js';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/use-auth';

type AuthChangeHandler = (event: string, session: Session | null) => void;

const mocks = vi.hoisted(() => {
  const handlers: AuthChangeHandler[] = [];
  return {
    handlers,
    getSession: vi.fn(async () => ({ data: { session: null as Session | null }, error: null })),
    onAuthStateChange: vi.fn((handler: AuthChangeHandler) => {
      handlers.push(handler);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    updateUser: vi.fn(async () => ({ error: null })),
    upsert: vi.fn(async () => ({ error: null })),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
    },
    from: () => ({ upsert: mocks.upsert }),
  },
}));

function sessionFor(userId: string): Session {
  return { user: { id: userId } } as Session;
}

function Probe() {
  const { status, user, signIn, signOut, requestPasswordReset, updatePassword } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.id ?? 'none'}</span>
      <button onClick={() => void signIn('owner@example.com', 'pw')}>sign in</button>
      <button onClick={() => void signOut()}>sign out</button>
      <button onClick={() => void requestPasswordReset('owner@example.com')}>reset</button>
      <button onClick={() => void updatePassword('new password')}>update</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.handlers.length = 0;
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

describe('AuthProvider', () => {
  it('starts in the loading state and settles to unauthenticated without a session', async () => {
    renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
  });

  it('settles to authenticated when a persisted session is restored', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: sessionFor('user-1') },
      error: null,
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );
    expect(screen.getByTestId('user')).toHaveTextContent('user-1');
  });

  it('treats a failed session lookup as unauthenticated rather than crashing', async () => {
    mocks.getSession.mockRejectedValue(new Error('network down'));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
  });

  it('follows later auth state changes', async () => {
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );

    mocks.handlers.forEach((handler) => handler('SIGNED_IN', sessionFor('user-2')));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );

    mocks.handlers.forEach((handler) => handler('SIGNED_OUT', null));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
  });

  it('ensures a profile row once the user is known', async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: sessionFor('user-3') },
      error: null,
    });

    renderProvider();

    await waitFor(() => expect(mocks.upsert).toHaveBeenCalled());
    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: 'user-3' },
      { onConflict: 'user_id', ignoreDuplicates: true },
    );
  });

  it('exposes the Supabase auth operations', async () => {
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );

    screen.getByText('sign in').click();
    screen.getByText('sign out').click();
    screen.getByText('reset').click();
    screen.getByText('update').click();

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'owner@example.com',
        password: 'pw',
      });
      expect(mocks.signOut).toHaveBeenCalled();
      expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('owner@example.com', {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'new password' });
    });
  });
});

describe('useAuth', () => {
  it('fails loudly when used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow('useAuth must be used inside an AuthProvider');

    consoleError.mockRestore();
  });
});
