"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "cun_sound_enabled";

/**
 * Synthesizes a short warning beep with the Web Audio API — no audio file to
 * ship or load, and full control over how short/loud it is.
 *
 * Browsers block audio until a real user gesture unlocks the AudioContext,
 * so callers must invoke `unlock()` from an existing click handler
 * (Start/Pause/Resume, or the mute toggle itself) — see ControlView/
 * DisplayView. `play()` also calls it defensively, which is a harmless
 * no-op once already unlocked.
 */
export function useBeepPlayer() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabledState] = useState(true);

  // Loading from localStorage must happen post-hydration to avoid SSR mismatch
  // (same pattern as lastTournamentSettings.ts / tournaments/new/page.tsx).
  useEffect(() => {
    function loadSavedPreference() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored !== null) setEnabledState(stored === "1");
      } catch {
        // Private browsing / storage disabled — keep the in-memory default.
      }
    }
    loadSavedPreference();
  }, []);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Ignore storage failures — the in-memory toggle still works this session.
    }
  }, []);

  const unlock = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  const play = useCallback(() => {
    if (!enabled) return;
    unlock();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Short, clean sine "beep": quick attack, quick decay — audible over
    // table chatter without being harsh or overly loud.
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }, [enabled, unlock]);

  return { enabled, setEnabled, play, unlock };
}
