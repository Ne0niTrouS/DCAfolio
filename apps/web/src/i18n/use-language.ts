import { useContext, useMemo } from 'react';

import {
  DEFAULT_LANGUAGE,
  LanguageContext,
  type LanguageContextValue,
  type TranslationKey,
} from './language-context';
import { translate } from './translate';

/**
 * The language and the `t` translator.
 *
 * Without a provider this reports the default language rather than throwing, so
 * a component can be rendered on its own and still produce the text a user
 * would actually see. `setLanguage` is then inert — there is no state to hold it.
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  const fallback = useMemo<LanguageContextValue>(
    () => ({
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) =>
        translate(DEFAULT_LANGUAGE, key, params),
    }),
    [],
  );

  return context ?? fallback;
}

/** Shorthand for components that only need to translate. */
export function useT(): LanguageContextValue['t'] {
  return useLanguage().t;
}
