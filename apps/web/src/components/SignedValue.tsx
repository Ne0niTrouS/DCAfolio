import { UNAVAILABLE, formatSignedMoney, formatSignedPercent } from '@dcafolio/shared';

import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';

/**
 * Profit and loss are never communicated by colour alone.
 *
 * Three cues carry the meaning independently: an arrow, an explicit + or -, and
 * a screen-reader label that says "profit" or "loss" in words. Colour is a
 * fourth cue for people who can use it, and the value stays readable with every
 * colour stripped out.
 *
 * Zero deliberately gets no arrow rather than the em dash a spec might suggest:
 * `—` already means "no value at all" everywhere in this app, and making
 * break-even look identical to missing data would trade one ambiguity for a
 * worse one.
 */

function toneFor(value: number): string {
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-ink';
}

function labelKeyFor(value: number): TranslationKey {
  if (value > 0) return 'value.profit';
  if (value < 0) return 'value.loss';
  return 'value.breakEven';
}

/** Decorative: the sign and the spoken label already carry this meaning. */
function Arrow({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span aria-hidden="true" className="me-0.5">
      {value > 0 ? '↑' : '↓'}
    </span>
  );
}

export function SignedMoney({
  value,
  className = '',
}: {
  value: string | null;
  className?: string;
}) {
  const t = useT();

  if (value === null) {
    return <span className={`tnum text-ink-faint ${className}`}>{UNAVAILABLE}</span>;
  }

  const numeric = Number(value);
  return (
    <span className={`tnum whitespace-nowrap ${toneFor(numeric)} ${className}`}>
      <Arrow value={numeric} />
      {formatSignedMoney(value)}
      <span className="sr-only"> ({t(labelKeyFor(numeric))})</span>
    </span>
  );
}

export function SignedPercent({
  value,
  className = '',
}: {
  value: number | null;
  className?: string;
}) {
  const t = useT();

  if (value === null) {
    return <span className={`tnum text-ink-faint ${className}`}>{UNAVAILABLE}</span>;
  }

  return (
    <span className={`tnum whitespace-nowrap ${toneFor(value)} ${className}`}>
      <Arrow value={value} />
      {formatSignedPercent(value)}
      <span className="sr-only"> ({t(labelKeyFor(value))})</span>
    </span>
  );
}
