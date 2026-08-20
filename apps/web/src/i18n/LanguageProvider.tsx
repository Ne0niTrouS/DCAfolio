import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { AuthContext } from '@/features/auth/auth-context';

import {
  DEFAULT_LANGUAGE,
  LanguageContext,
  type Language,
  type LanguageContextValue,
  type TranslationKey,
} from './language-context';
import { translate } from './translate';

/**
 * Holds the UI language for the whole application.
 *
 * The choice is kept in memory only, never in storage. That is deliberate: the
 * login screen must always open in Thai, so a language picked during a previous
 * session must not survive to force it into English. Switching affects the
 * current session, the current route and any open modal, and nothing else.
 *
 * Crossing the authentication boundary resets to Thai — signing in and signing
 * out both start their side of the app in the default language.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // Read directly rather than through useAuth: the provider must also work in
  // isolation, where no AuthProvider is mounted above it.
  const auth = useContext(AuthContext);
  const status = auth?.status ?? null;
  const previousStatus = useRef(status);

  useEffect(() => {
    if (previousStatus.current === status) return;
    previousStatus.current = status;
    setLanguage(DEFAULT_LANGUAGE);
  }, [status]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
