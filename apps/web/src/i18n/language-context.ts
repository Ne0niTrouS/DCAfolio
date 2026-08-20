import { createContext } from 'react';

import type { Dictionary, TranslationKey } from './en';
import { en } from './en';
import { th } from './th';

export const LANGUAGES = ['th', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Shown on the language button and in the dropdown, each in its own script. */
export const LANGUAGE_LABEL: Record<Language, string> = {
  th: 'ไทย',
  en: 'English',
};

export const DICTIONARIES: Record<Language, Dictionary> = { th, en };

/**
 * Thai is the starting language everywhere — the login screen, and the
 * authenticated app immediately after signing in. A component rendered without
 * a provider therefore behaves exactly as it does in the running app.
 */
export const DEFAULT_LANGUAGE: Language = 'th';

export type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export type { Dictionary, TranslationKey };
export { en, th };
