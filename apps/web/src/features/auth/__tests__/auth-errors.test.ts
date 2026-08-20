import { describe, expect, it } from 'vitest';

import { mapAuthError } from '@/features/auth/auth-errors';

describe('mapAuthError', () => {
  it('keeps a failed sign-in vague about which part was wrong', () => {
    expect(mapAuthError(new Error('Invalid login credentials'))).toBe(
      'error.invalidCredentials',
    );
  });

  it('explains a rate limit', () => {
    expect(mapAuthError(new Error('Request rate limit reached'))).toBe('error.rateLimited');
  });

  it('explains a network failure', () => {
    expect(mapAuthError(new TypeError('Failed to fetch'))).toBe('error.network');
  });

  it('explains an expired recovery link', () => {
    expect(mapAuthError(new Error('Token has expired or is invalid'))).toBe(
      'error.linkExpired',
    );
  });

  it('never leaks an unrecognised provider error', () => {
    expect(mapAuthError(new Error('PGRST301: JWSError JWSInvalidSignature'))).toBe(
      'error.generic',
    );
    expect(mapAuthError({ weird: true })).toBe('error.generic');
    expect(mapAuthError(null)).toBe('error.generic');
  });
});
