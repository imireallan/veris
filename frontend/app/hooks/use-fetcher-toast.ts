/**
 * Centralized toast notification hook for fetcher actions.
 * 
 * Automatically shows success/error toasts when fetcher completes,
 * and handles re-submission correctly (shows toast every time).
 * 
 * @example
 * ```tsx
 * const fetcher = useFetcher();
 * const { handleFetcherResult } = useFetcherToast();
 * 
 * useEffect(() => {
 *   handleFetcherResult(fetcher, {
 *     success: (data) => toastSuccess("Updated", data.message),
 *     error: (data) => toastError("Failed", data.error),
 *   });
 * }, [fetcher, toastSuccess, toastError]);
 * ```
 */

import { useRef } from "react";
import type { Fetcher } from "react-router";

interface FetcherToastOptions<T = any> {
  /** Called when fetcher.data contains { success: true, ... } */
  success?: (data: T) => void;
  /** Called when fetcher.data contains { error: string, ... } */
  error?: (data: T) => void;
  /** Custom condition to determine if toast should show (optional) */
  shouldShowToast?: (data: T) => boolean;
  /** Map action types to custom success handlers (optional) */
  actionSuccessHandlers?: Record<string, (data: T) => void>;
}

export function useFetcherToast() {
  // Track whether we've shown toast for the current fetcher result
  const hasShownToast = useRef(false);
  const lastActionType = useRef<string | null>(null);

  /**
   * Handle fetcher result and show appropriate toast.
   * Automatically resets when fetcher starts submitting again.
   */
  function handleFetcherResult<T = any>(
    fetcher: Fetcher<T>,
    options: FetcherToastOptions<T>
  ) {
    const { success, error, shouldShowToast, actionSuccessHandlers } = options;

    // Reset flag when new submission starts
    if (fetcher.state === "submitting") {
      hasShownToast.current = false;
      // Read actionType from the form data to track which action is running
      const formData = fetcher.formData;
      if (formData) {
        lastActionType.current = formData.get("actionType") as string || null;
      }
    }

    // Show toast when fetcher completes (idle with data)
    if (fetcher.state === "idle" && fetcher.data && !hasShownToast.current) {
      const data = fetcher.data;

      // Check custom condition if provided
      if (shouldShowToast && !shouldShowToast(data)) {
        return;
      }

      // Handle success case
      if (typeof data === "object" && data !== null && "success" in data && (data as any).success === true) {
        // Use action-specific handler if available
        if (actionSuccessHandlers && lastActionType.current) {
          const handler = actionSuccessHandlers[lastActionType.current];
          if (handler) {
            handler(data as T);
            hasShownToast.current = true;
            lastActionType.current = null;
            return;
          }
        }
        // Fall back to generic success handler
        if (success) {
          success(data as T);
          hasShownToast.current = true;
          lastActionType.current = null;
          return;
        }
      }

      // Handle error case
      if (error && typeof data === "object" && data !== null && "error" in data && (data as any).error) {
        error(data as T);
        hasShownToast.current = true;
        lastActionType.current = null;
        return;
      }
    }

    // Reset flag when fetcher is idle and has no data (ready for next action)
    if (fetcher.state === "idle" && !fetcher.data) {
      hasShownToast.current = false;
      lastActionType.current = null;
    }
  }

  return { handleFetcherResult };
}
