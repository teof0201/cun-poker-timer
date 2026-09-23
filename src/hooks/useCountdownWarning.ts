"use client";

import { useEffect, useRef } from "react";
import type { TimerSnapshot } from "@/lib/timerEngine";

const BEEP_SECONDS = new Set([5, 3, 2, 1]); // no beep at 4, per spec
const WARNING_MAX_SECONDS = 5;

/**
 * Derives the "last 5 seconds" red-warning flag from the existing
 * timestamp-based timer snapshot, and fires exactly one beep per
 * second-mark (5, 3, 2, 1). Deliberately does NOT run its own interval —
 * it piggybacks on whatever cadence re-renders `snapshot` (useTimerSnapshot's
 * 250ms tick), so there is only ever one clock driving both the countdown
 * display and the warning/beep logic.
 *
 * The "already beeped" bookkeeping is keyed off `levelStartedAt`, which the
 * server gives a fresh timestamp on every start/resume/next/prev/reopen/
 * setRemainingTime. That means a previous level's beeps can never suppress
 * the same marks in a new one, and resuming from a pause inside the warning
 * window gets a clean slate too — both required by the spec.
 */
export function useCountdownWarning(
  snapshot: TimerSnapshot | null,
  levelStartedAt: number | null,
  onBeep: () => void,
): boolean {
  const beepedSecondsRef = useRef<Set<number>>(new Set());
  const epochRef = useRef<number | null>(null);

  const isRunning = !!snapshot && snapshot.status === "running";
  const secondsLeft = snapshot ? Math.ceil(snapshot.remainingMs / 1000) : 0;
  // isWarning is purely derived from the current snapshot — no need for a
  // second piece of state kept in sync via an effect.
  const isWarning = isRunning && secondsLeft >= 1 && secondsLeft <= WARNING_MAX_SECONDS;

  // The beep itself is a real side effect (touches the Web Audio API), so it
  // still needs an effect — but only for that, not for `isWarning` above.
  useEffect(() => {
    if (!isRunning) return;

    if (epochRef.current !== levelStartedAt) {
      epochRef.current = levelStartedAt;
      beepedSecondsRef.current = new Set();
    }

    if (isWarning && BEEP_SECONDS.has(secondsLeft) && !beepedSecondsRef.current.has(secondsLeft)) {
      beepedSecondsRef.current.add(secondsLeft);
      onBeep();
    }
  }, [isRunning, isWarning, secondsLeft, levelStartedAt, onBeep]);

  return isWarning;
}
