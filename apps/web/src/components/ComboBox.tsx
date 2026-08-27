import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { useT } from '@/i18n/use-language';

import { ChevronDownIcon } from './icons';

export type ComboBoxOption = {
  value: string;
  /** What the field shows once chosen, and what typing matches against. */
  label: string;
  /** Extra text shown under the label and also searched — a Thai name, say. */
  hint?: string;
};

type ComboBoxProps = {
  label: string;
  value: string;
  options: ComboBoxOption[];
  placeholder?: string;
  error?: string | undefined;
  onChange: (value: string) => void;
};

function matches(option: ComboBoxOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    option.label.toLowerCase().includes(needle) ||
    (option.hint?.toLowerCase().includes(needle) ?? false)
  );
}

/**
 * A select you can type into.
 *
 * A native `<select>` stops being usable once the list is long: on a phone it
 * becomes a wheel of a hundred rows. This filters as you type, over the symbol
 * *and* the Thai company name, so "ปตท" finds PTT and "bank" finds KBANK.
 *
 * Built on the ARIA combobox pattern rather than a library: a text input owning
 * a listbox, driven with the arrow keys, Enter and Escape, with the active row
 * announced through `aria-activedescendant`. Closing without choosing restores
 * whatever was selected before, so the field can never be left showing a
 * half-typed value that is not the actual selection.
 */
export function ComboBox({
  label,
  value,
  options,
  placeholder,
  error,
  onChange,
}: ComboBoxProps) {
  const t = useT();
  const id = useId();
  const listId = `${id}-list`;
  const errorId = `${id}-error`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((option) => option.value === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  const visible = useMemo(
    () => (open ? options.filter((option) => matches(option, query)) : options),
    [open, options, query],
  );

  // Clamped on read rather than corrected in an effect: as the query shrinks
  // the list, the stored index can point past the end, and deriving the answer
  // here avoids a second render just to fix it up.
  const activeIndex = Math.min(highlighted, Math.max(visible.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      close(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  });

  function close(restoreFocus: boolean) {
    setOpen(false);
    setQuery('');
    if (restoreFocus) inputRef.current?.focus();
  }

  function openList() {
    if (open) return;
    setOpen(true);
    setQuery('');
    setHighlighted(
      Math.max(
        options.findIndex((option) => option.value === value),
        0,
      ),
    );
  }

  function choose(option: ComboBoxOption) {
    onChange(option.value);
    close(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) return openList();
        return setHighlighted((current) => Math.min(current + 1, visible.length - 1));
      case 'ArrowUp':
        event.preventDefault();
        if (!open) return openList();
        return setHighlighted((current) => Math.max(current - 1, 0));
      case 'Home':
        if (!open) return;
        event.preventDefault();
        return setHighlighted(0);
      case 'End':
        if (!open) return;
        event.preventDefault();
        return setHighlighted(visible.length - 1);
      case 'Enter': {
        if (!open) return;
        // Enter picks the highlighted row; it must not submit the form too.
        event.preventDefault();
        const option = visible[activeIndex];
        if (option) choose(option);
        return;
      }
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        return close(true);
      default:
        return;
    }
  }

  const activeOption = open ? visible[activeIndex] : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>

      <div ref={containerRef} className="relative">
        <div
          className={`flex min-h-12 items-center gap-2 rounded-xl border bg-surface-raised px-3 transition-colors focus-within:ring-4 ${
            error
              ? 'border-loss focus-within:border-loss focus-within:ring-loss/15'
              : 'border-gray-300 focus-within:border-accent focus-within:ring-accent/15'
          }`}
        >
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeOption ? `${id}-${activeOption.value}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder={placeholder}
            value={open ? query : (selected?.label ?? '')}
            onChange={(event) => {
              if (!open) setOpen(true);
              setQuery(event.target.value);
              setHighlighted(0);
            }}
            onFocus={openList}
            onClick={openList}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <ChevronDownIcon
            className={`size-4 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>

        {open ? (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute inset-x-0 top-[calc(100%+0.25rem)] z-50 max-h-64 overflow-y-auto rounded-xl border border-border-subtle bg-surface-raised py-1 shadow-xl"
          >
            {visible.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-ink-muted">{t('common.noMatches')}</li>
            ) : (
              visible.map((option, index) => {
                const active = index === activeIndex;
                const chosen = option.value === value;
                return (
                  <li
                    key={option.value}
                    id={`${id}-${option.value}`}
                    role="option"
                    aria-selected={chosen}
                    data-active={active}
                    // The input keeps focus, so the press must not move it away.
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => choose(option)}
                    className={`cursor-pointer px-3 py-2.5 text-sm ${
                      active ? 'bg-accent-subtle' : ''
                    } ${chosen ? 'font-semibold text-accent-strong' : 'text-ink'}`}
                  >
                    {option.label}
                    {option.hint ? (
                      <span className="block truncate text-xs text-ink-muted">
                        {option.hint}
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-loss">
          {error}
        </p>
      ) : null}
    </div>
  );
}
