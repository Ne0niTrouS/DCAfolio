import { UNAVAILABLE, relativeTimeParts } from '@dcafolio/shared';
import { useCallback } from 'react';

import { useT } from './use-language';

/**
 * Renders a timestamp's age in the current language.
 *
 * `@dcafolio/shared` supplies the unit and count; the wording lives here,
 * because English needs a singular form where Thai does not.
 */
export function useRelativeTime(): (isoTimestamp: string | null | undefined) => string {
  const t = useT();

  return useCallback(
    (isoTimestamp: string | null | undefined) => {
      const parts = relativeTimeParts(isoTimestamp);
      if (!parts) return UNAVAILABLE;

      switch (parts.unit) {
        case 'justNow':
          return t('time.justNow');
        case 'minutes':
          return t('time.minutesAgo', { count: parts.count });
        case 'hours':
          return parts.count === 1
            ? t('time.hourAgo')
            : t('time.hoursAgo', { count: parts.count });
        case 'days':
          return parts.count === 1
            ? t('time.dayAgo')
            : t('time.daysAgo', { count: parts.count });
      }
    },
    [t],
  );
}
