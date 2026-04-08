import { useCallback, useEffect, useRef } from "react";

const DRAFT_PREFIX = "veris:draft:";

/**
 * Persist arbitrary form data to localStorage with debounce.
 * Restore on mount. Clear on demand.
 */
export function useDraft<T extends Record<string, any>>(
  key: string,
  state: T,
  setAll: (fn: (prev: T) => T) => void,
  delay = 500,
) {
  const storageKey = DRAFT_PREFIX + key;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Restore on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAll(() => JSON.parse(raw));
    } catch { /* ignore corrupt data */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced save on every state change
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }, delay);
    return () => clearTimeout(timer.current);
  }, [state, storageKey, delay]);

  /** Clear this draft (call after successful submit). */
  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  /** Get human-readable info about the draft. */
  const info = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        return { exists: true, step: data.step ?? 0, savedAt: Date.now() };
      }
    } catch { /* noop */ }
    return { exists: false, step: 0 };
  }, [storageKey]);

  return { clear, info };
}
