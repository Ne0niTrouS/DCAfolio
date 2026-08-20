import { Link } from 'react-router-dom';

import { AuthBackdrop, AuthCard } from '@/components/AuthBackdrop';
import { BrandMark } from '@/components/Brand';
import { useLanguage } from '@/i18n/use-language';

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <AuthBackdrop>
      <AuthCard>
        <div className="flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent-bright ring-1 ring-accent/30">
            <BrandMark className="size-8" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {t('common.notFoundTitle')}
          </h1>
          <p className="mt-2 text-sm text-nav-ink-muted">{t('common.notFoundBody')}</p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-accent-bright hover:underline"
          >
            {t('common.backToDashboard')}
          </Link>
        </div>
      </AuthCard>
    </AuthBackdrop>
  );
}
