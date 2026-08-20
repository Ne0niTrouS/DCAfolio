import { describe, expect, it } from 'vitest';

import { mapAuthError } from '@/features/auth/auth-errors';

describe('mapAuthError', () => {
  it('keeps a failed sign-in vague about which part was wrong', () => {
    expect(mapAuthError(new Error('Invalid login credentials'))).toBe(
      'Incorrect email or password.',
    );
  });

  it('explains a rate limit', () => {
    expect(mapAuthError(new Error('Request rate limit reached'))).toBe(
      'Too many attempts. Please wait a moment and try again.',
    );
  });

  it('explains a network failure', () => {
    expect(mapAuthError(new TypeError('Failed to fetch'))).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
  });

  it('explains an expired recovery link', () => {
    expect(mapAuthError(new Error('Token has expired or is invalid'))).toBe(
      'This link is no longer valid. Request a new password reset email.',
    );
  });

  it('never leaks an unrecognised provider error', () => {
    expect(mapAuthError(new Error('PGRST301: JWSError JWSInvalidSignature'))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(mapAuthError({ weird: true })).toBe('Something went wrong. Please try again.');
    expect(mapAuthError(null)).toBe('Something went wrong. Please try again.');
  });
});
