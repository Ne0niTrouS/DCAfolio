import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

import type { TranslationKey } from '@/i18n/en';
import { DEFAULT_LANGUAGE, LanguageContext, type Language } from '@/i18n/language-context';
import { translate } from '@/i18n/translate';

/**
 * The phrase a user actually sees in the application's default language.
 *
 * Tests look the wording up rather than repeating it, so a copy change does not
 * break twenty assertions. The dictionaries themselves — that Thai really is
 * Thai — are asserted with literals in `i18n.test.tsx`.
 */
export function phrase(key: TranslationKey, params?: Record<string, string | number>): string {
  return translate(DEFAULT_LANGUAGE, key, params);
}

export function phraseIn(
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  return translate(language, key, params);
}

/** Renders with a fixed language, for asserting one specific locale. */
export function renderInLanguage(ui: ReactElement, language: Language): RenderResult {
  return render(
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: () => {},
        t: (key, params) => translate(language, key, params),
      }}
    >
      {ui}
    </LanguageContext.Provider>,
  );
}
