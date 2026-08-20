import { APP_CREDIT, APP_NAME } from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

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

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<TranslationKey | undefined>();
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError('auth.invalidEmail');
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
    <AuthBackdrop>
      <div className="mb-4 flex justify-end">
        <LanguageSelector />
      </div>

      <AuthCard>
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('auth.resetTitle')}</p>
        </header>

        {sent ? (
          <div className="mt-7">
            {/* Deliberately neutral: it must not reveal whether an address is
                registered. */}
            <Alert tone="success">{t('auth.resetSent')}</Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
            {formError ? <Alert>{t(formError)}</Alert> : null}

            <TextField
              label={t('auth.email')}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              error={emailError ? t(emailError) : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Button type="submit" pending={pending} className="mt-2 w-full">
              {t('auth.sendResetLink')}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-accent-strong hover:underline">
            {t('common.backToLogin')}
          </Link>
        </p>
      </AuthCard>

      <p className="mt-8 text-center text-xs text-nav-ink-muted">© {APP_CREDIT}</p>
    </AuthBackdrop>
  );
}
