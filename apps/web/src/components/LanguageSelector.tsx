import { useEffect, useRef, useState } from 'react';

import { LANGUAGES, LANGUAGE_LABEL, type Language } from '@/i18n/language-context';
import { useLanguage } from '@/i18n/use-language';

/**
 * The one language control in the application — used on the login screen and in
 * the navigation bar. The button shows the language that is active right now
 * ("ไทย" / "English"), never a generic "Language" caption, so the current state
 * is readable without opening anything.
 *
 * Both placements sit on the dark brand surface, so one visual treatment serves
 * both. The menu closes on outside click and on Escape.
 */
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function choose(next: Language) {
    setLanguage(next);
    setOpen(false);
    triggerRef.current?.focus();
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
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        {LANGUAGE_LABEL[language]}
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
