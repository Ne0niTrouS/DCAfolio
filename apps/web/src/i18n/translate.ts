import { DICTIONARIES, type Language, type TranslationKey } from './language-context';

/**
 * Looks up a phrase and substitutes `{name}` placeholders.
 *
 * A key is always present — `TranslationKey` is derived from the English
 * dictionary and every language is typed against it — so there is no missing-key
 * fallback to hide a mistake behind.
 */
export function translate(
  language: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const phrase = DICTIONARIES[language][key];
  if (!params) return phrase;

  return phrase.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
