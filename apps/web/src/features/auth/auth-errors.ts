/**
 * Turns a Supabase auth failure into a single sentence a person can act on.
 *
 * Raw provider errors are never rendered: they leak implementation detail and
 * read as noise. Sign-in failures stay deliberately vague about whether the
 * address exists.
 */
export function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('email not confirmed')) {
    return 'This email address has not been confirmed yet.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  if (message.includes('password') && message.includes('at least')) {
    return 'That password is too short.';
  }
  if (message.includes('same password')) {
    return 'The new password must be different from the current one.';
  }
  // Deliberately narrow: matching a bare "invalid" would swallow unrelated
  // failures such as an invalid JWT signature and mislabel them as a bad link.
  if (message.includes('expired') || message.includes('link is invalid')) {
    return 'This link is no longer valid. Request a new password reset email.';
  }

  return 'Something went wrong. Please try again.';
}
