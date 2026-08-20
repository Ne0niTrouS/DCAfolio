import { Link } from 'react-router-dom';

import { AuthBackdrop, AuthCard } from '@/components/AuthBackdrop';
import { useLanguage } from '@/i18n/use-language';

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <AuthBackdrop>
      <AuthCard>
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t('common.notFoundTitle')}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{t('common.notFoundBody')}</p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-accent-strong hover:underline"
          >
            {t('common.backToDashboard')}
          </Link>
        </div>
      </AuthCard>
    </AuthBackdrop>
  );
}
