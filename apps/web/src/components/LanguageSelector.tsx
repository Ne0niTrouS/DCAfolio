import { useCallback, useRef, useState } from 'react';

import { LANGUAGES, LANGUAGE_LABEL, type Language } from '@/i18n/language-context';
import { useLanguage } from '@/i18n/use-language';
import { useDismiss } from '@/lib/use-dismiss';

import { ChevronDownIcon } from './icons';

/**
 * The one language control in the application — used on the signed-out screens
 * and in the navigation bar. The button shows the language that is active right
 * now ("ไทย" / "English"), never a generic "Language" caption, so the current
 * state is readable without opening anything.
 *
 * Both placements sit on the dark brand surface, so one visual treatment serves
 * both. The menu closes on outside click and on Escape.
 */
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useDismiss(open, containerRef, dismiss);

  function choose(next: Language) {
    setLanguage(next);
    dismiss(true);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${t('common.language')}: ${LANGUAGE_LABEL[language]}`}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-nav-border bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-nav-hover"
      >
        {LANGUAGE_LABEL[language]}
        <ChevronDownIcon
          className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('common.language')}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] min-w-40 overflow-hidden rounded-xl border border-border-subtle bg-surface-raised py-1 shadow-xl"
        >
          {LANGUAGES.map((option) => {
            const active = option === language;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(option)}
                className={`flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm transition-colors hover:bg-accent-subtle ${
                  active ? 'font-semibold text-accent-strong' : 'text-ink'
                }`}
              >
                <span aria-hidden="true" className="w-4 text-accent">
                  {active ? '✓' : ''}
                </span>
                {LANGUAGE_LABEL[option]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
