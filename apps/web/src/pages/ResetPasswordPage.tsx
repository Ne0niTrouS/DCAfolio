import { APP_CREDIT, APP_NAME } from '@dcafolio/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Alert } from '@/components/Alert';
import { AuthBackdrop, AuthCard } from '@/components/AuthBackdrop';
import { Button } from '@/components/Button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { TextField } from '@/components/TextField';
import { mapAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/use-auth';
import type { TranslationKey } from '@/i18n/en';
import { useLanguage } from '@/i18n/use-language';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<{
    password?: TranslationKey;
    confirmation?: TranslationKey;
  }>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: { password?: TranslationKey; confirmation?: TranslationKey } = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = 'auth.passwordTooShort';
    }
    if (password !== confirmation) {
      nextErrors.confirmation = 'auth.passwordsDoNotMatch';
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
    <AuthBackdrop>
      <div className="mb-4 flex justify-end">
        <LanguageSelector />
      </div>

      <AuthCard>
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('auth.chooseNewPassword')}</p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
          {formError ? <Alert>{t(formError)}</Alert> : null}

          <TextField
            label={t('auth.newPassword')}
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            error={
              errors.password ? t(errors.password, { count: MIN_PASSWORD_LENGTH }) : undefined
            }
            hint={t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
            onChange={(event) => setPassword(event.target.value)}
          />

          <TextField
            label={t('auth.confirmNewPassword')}
            type="password"
            name="confirmation"
            autoComplete="new-password"
            value={confirmation}
            error={errors.confirmation ? t(errors.confirmation) : undefined}
            onChange={(event) => setConfirmation(event.target.value)}
          />

          <Button type="submit" pending={pending} className="mt-2 w-full">
            {t('auth.updatePassword')}
          </Button>
        </form>

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
