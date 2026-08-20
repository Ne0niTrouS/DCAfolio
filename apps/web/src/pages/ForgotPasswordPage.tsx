import { APP_CREDIT, APP_NAME } from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The confirmation is deliberately neutral: it must not reveal whether an
 * address is registered.
 */
const NEUTRAL_CONFIRMATION =
  'If an account exists for that address, a reset link has been sent.';

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);

    setPending(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(mapAuthError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-ink-muted">Reset your password</p>
        </header>

        {sent ? (
          <div className="mt-8">
            <Alert tone="success">{NEUTRAL_CONFIRMATION}</Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
            {formError ? <Alert>{formError}</Alert> : null}

            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              error={emailError}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Button type="submit" pending={pending} className="mt-2 w-full">
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-accent hover:underline">
            Back to login
          </Link>
        </p>

        <p className="mt-10 text-center text-xs text-ink-muted">© {APP_CREDIT}</p>
      </div>
    </main>
  );
}
