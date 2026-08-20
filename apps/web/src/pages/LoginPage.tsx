import { APP_CREDIT, APP_NAME, APP_SUBTITLE } from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { status, signIn } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: { email?: string; password?: string } = {};
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (password.length === 0) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await signIn(email.trim(), password);
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
          <p className="mt-1 text-sm text-ink-muted">{APP_SUBTITLE}</p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
          {formError ? <Alert>{formError}</Alert> : null}

          <TextField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            error={fieldErrors.email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" pending={pending} className="mt-2 w-full">
            Login
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="text-accent hover:underline">
            Forgot Password?
          </Link>
        </p>

        <p className="mt-10 text-center text-xs text-ink-muted">© {APP_CREDIT}</p>
      </div>
    </main>
  );
}
