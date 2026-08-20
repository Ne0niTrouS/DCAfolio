import { APP_CREDIT, APP_NAME } from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Alert } from '@/components/Alert';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: { password?: string; confirmation?: string } = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmation) {
      nextErrors.confirmation = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      await updatePassword(password);
      void navigate('/', { replace: true });
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
          <p className="mt-1 text-sm text-ink-muted">Choose a new password</p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
          {formError ? <Alert>{formError}</Alert> : null}

          <TextField
            label="New password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            onChange={(event) => setPassword(event.target.value)}
          />

          <TextField
            label="Confirm new password"
            type="password"
            name="confirmation"
            autoComplete="new-password"
            value={confirmation}
            error={errors.confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />

          <Button type="submit" pending={pending} className="mt-2 w-full">
            Update password
          </Button>
        </form>

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
