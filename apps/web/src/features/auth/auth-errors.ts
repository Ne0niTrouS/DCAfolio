import type { TranslationKey } from '@/i18n/en';

/**
 * Turns a Supabase auth failure into a translation key the caller renders in
 * the reader's language.
 *
 * Raw provider errors are never shown: they leak implementation detail and read
 * as noise. Sign-in failures stay deliberately vague about whether the address
 * exists.
 */
export function mapAuthError(error: unknown): TranslationKey {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('invalid login credentials')) {
    return 'error.invalidCredentials';
  }
  if (message.includes('email not confirmed')) {
    return 'error.emailNotConfirmed';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'error.rateLimited';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'error.network';
  }
  if (message.includes('password') && message.includes('at least')) {
    return 'error.passwordTooShort';
  }
  if (message.includes('same password')) {
    return 'error.samePassword';
  }
  // Deliberately narrow: matching a bare "invalid" would swallow unrelated
  // failures such as an invalid JWT signature and mislabel them as a bad link.
  if (message.includes('expired') || message.includes('link is invalid')) {
    return 'error.linkExpired';
  }

  return 'error.generic';
}
