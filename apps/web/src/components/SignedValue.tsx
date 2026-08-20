import { UNAVAILABLE, formatSignedMoney, formatSignedPercent } from '@dcafolio/shared';

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

function labelFor(value: number): string {
  if (value > 0) return 'profit';
  if (value < 0) return 'loss';
  return 'break-even';
}

export function SignedMoney({
  value,
  className = '',
}: {
  value: string | null;
  className?: string;
}) {
  if (value === null) {
    return <span className={`tnum text-ink-muted ${className}`}>{UNAVAILABLE}</span>;
  }

  const numeric = Number(value);
  return (
    <span className={`tnum ${toneFor(numeric)} ${className}`}>
      {formatSignedMoney(value)}
      <span className="sr-only"> ({labelFor(numeric)})</span>
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
    return <span className={`tnum text-ink-muted ${className}`}>{UNAVAILABLE}</span>;
  }

  return (
    <span className={`tnum ${toneFor(value)} ${className}`}>{formatSignedPercent(value)}</span>
  );
}
