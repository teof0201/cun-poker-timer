"use client";

import { useEffect } from "react";

/**
 * Keeps the device screen from sleeping while the component using this hook
 * is mounted (e.g. the control/display screens during a tournament). Browsers
 * release the lock whenever the tab is hidden, so we re-acquire it on
 * visibility change too. Silently does nothing on browsers without support
 * (older Safari/Firefox) — there's no good fallback, so we just skip it.
 */
export function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Can fail if the tab isn't visible yet or the OS denies it — not fatal.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !cancelled) {
        acquire();
      }
    }

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      lock?.release().catch(() => {});
    };
  }, []);
}
