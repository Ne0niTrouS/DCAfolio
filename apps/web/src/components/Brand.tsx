import { APP_NAME } from '@dcafolio/shared';

/**
 * The DCAfolio mark: a rising trend line inside a ring.
 *
 * Decorative — every place that uses it also renders the product name as text,
 * so the icon carries no information of its own.
 */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="82 25"
        transform="rotate(-38 20 20)"
      />
      <path
        d="M12.5 24.5 18 18.5l4 3.6 6-7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.6 13.9H28.6V18.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * "DCAfolio" set in two tones. The split is purely visual: the accessible name
 * stays the single word, so it is never read out as two.
 */
export function BrandWordmark({ className = '' }: { className?: string }) {
  const [head, tail] = [APP_NAME.slice(0, 3), APP_NAME.slice(3)];

  return (
    <span className={`font-semibold tracking-tight ${className}`} aria-label={APP_NAME}>
      <span aria-hidden="true">{head}</span>
      <span aria-hidden="true" className="text-accent-bright">
        {tail}
      </span>
    </span>
  );
}
