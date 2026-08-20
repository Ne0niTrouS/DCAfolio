import { useEffect, type RefObject } from 'react';

/**
 * Closes a popover on Escape or on a pointer press outside it.
 *
 * Shared by the language selector and the account menu so both behave
 * identically — a menu that only closes one of those two ways is a trap.
 */
export function useDismiss(
  open: boolean,
  container: RefObject<HTMLElement | null>,
  onDismiss: (restoreFocus: boolean) => void,
): void {
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!container.current?.contains(event.target as Node)) onDismiss(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss(true);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, container, onDismiss]);
}
