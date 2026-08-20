import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from '@/features/auth/auth-context';

import { createTestQueryClient } from './query-harness';

/**
 * A stub auth context. Tests that exercise a page's behaviour use this rather
 * than mocking Supabase, so they assert on the component and not on transport.
 */
export function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const status: AuthStatus = overrides.status ?? 'unauthenticated';
  return {
    status,
    session: null,
    user: null,
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    requestPasswordReset: vi.fn(async () => {}),
    updatePassword: vi.fn(async () => {}),
    ...overrides,
  };
}

export function AuthHarness({
  auth,
  initialEntries = ['/'],
  children,
}: {
  auth: AuthContextValue;
  initialEntries?: string[];
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithAuth(
  ui: ReactElement,
  options: { auth?: AuthContextValue; initialEntries?: string[] } = {},
): RenderResult & { auth: AuthContextValue } {
  const auth = options.auth ?? createAuthValue();
  const result = render(
    <AuthHarness auth={auth} initialEntries={options.initialEntries ?? ['/']}>
      {ui}
    </AuthHarness>,
  );
  return { ...result, auth };
}
