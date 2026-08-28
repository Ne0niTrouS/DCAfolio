import { useEffect, useRef } from 'react';

import { useSyncPrices } from './use-sync-prices';

/** Where the last automatic attempt is remembered, per browser. */
export const AUTO_SYNC_STORAGE_KEY = 'dcafolio.lastAutoSync';

/**
 * How long an automatic sync stands for.
 *
 * Matches the server's own cooldown: asking again sooner cannot produce a new
 * price, it can only produce a `skipped` reply.
 */
export const AUTO_SYNC_INTERVAL_MINUTES = 15;

/**
 * Whether enough time has passed to sync again automatically.
 *
 * Deliberately counts from the last *attempt*, not the last success. Counting
 * successes would mean a provider outage plus a page-reload loop hammering the
 * provider unattended, which is exactly what nobody would be there to notice.
 */
export function shouldAutoSync(
  lastAttempt: string | null,
  now: Date,
  intervalMinutes: number = AUTO_SYNC_INTERVAL_MINUTES,
): boolean {
  if (!lastAttempt) return true;

  const at = new Date(lastAttempt).getTime();
  if (!Number.isFinite(at)) return true;

  const minutes = (now.getTime() - at) / 60_000;
  // A marker written in the future means a clock disagreement, not a fresh sync.
  return minutes < 0 || minutes >= intervalMinutes;
}

function readMarker(): string | null {
  try {
    return localStorage.getItem(AUTO_SYNC_STORAGE_KEY);
  } catch {
    // Private mode, or site data blocked. Syncing every load is worse than not
    // syncing at all, so treat an unreadable marker as "already done".
    return new Date().toISOString();
  }
}

function writeMarker(value: string): void {
  try {
    localStorage.setItem(AUTO_SYNC_STORAGE_KEY, value);
  } catch {
    // Nothing to do: the server cooldown is still in force.
  }
}

/**
 * Refreshes prices once after signing in, not on every visit to the dashboard.
 *
 * Mounted in the signed-in shell, so moving between pages does not re-trigger
 * it; the marker in `localStorage` covers a full page reload, which would
 * otherwise remount the shell and sync again. The result lands in the shared
 * price cache, which is what every screen already reads.
 */
export function useAutoSyncOnLogin(): void {
  const sync = useSyncPrices();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!shouldAutoSync(readMarker(), new Date())) return;

    writeMarker(new Date().toISOString());
    sync.mutate();
  }, [sync]);
}
