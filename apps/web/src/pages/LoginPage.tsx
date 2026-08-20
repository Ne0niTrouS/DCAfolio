import { APP_CREDIT, APP_NAME } from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Alert } from '@/components/Alert';
import { AuthBackdrop, AuthCard } from '@/components/AuthBackdrop';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { TextField } from '@/components/TextField';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';
import type { TranslationKey } from '@/i18n/en';
import { useLanguage } from '@/i18n/use-language';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { status, signIn } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: TranslationKey;
    password?: TranslationKey;
  }>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [pending, setPending] = useState(false);

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors: { email?: TranslationKey; password?: TranslationKey } = {};
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'auth.invalidEmail';
    if (password.length === 0) errors.password = 'auth.passwordRequired';
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
    <AuthBackdrop>
      <div className="mb-4 flex justify-end">
        <LanguageSelector />
      </div>

      <AuthCard>
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('common.appSubtitle')}</p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
          {formError ? <Alert>{t(formError)}</Alert> : null}

          <TextField
            label={t('auth.email')}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            error={fieldErrors.email ? t(fieldErrors.email) : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />

          <TextField
            label={t('auth.password')}
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password ? t(fieldErrors.password) : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" pending={pending} className="mt-2 w-full">
            {t('auth.login')}
          </Button>
        </form>
      </AuthCard>

      <p className="mt-8 text-center text-xs text-nav-ink-muted">© {APP_CREDIT}</p>
    </AuthBackdrop>
  );
}
