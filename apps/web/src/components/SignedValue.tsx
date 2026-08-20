import { UNAVAILABLE, formatSignedMoney, formatSignedPercent } from '@dcafolio/shared';

import type { TranslationKey } from '@/i18n/en';
import { useT } from '@/i18n/use-language';

/**
 * Profit and loss are never communicated by colour alone: the sign is always
 * present, and an assistive-technology label spells out "profit" or "loss".
 * Colour is a secondary cue for people who can use it.
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
    <span className={`tnum ${toneFor(numeric)} ${className}`}>
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
  if (value === null) {
    return <span className={`tnum text-ink-faint ${className}`}>{UNAVAILABLE}</span>;
  }

  return (
    <span className={`tnum ${toneFor(value)} ${className}`}>{formatSignedPercent(value)}</span>
  );
}
