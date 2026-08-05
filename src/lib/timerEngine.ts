import type { BlindLevel, SessionState } from "./types";

export type TimerSnapshot = {
  status: SessionState["status"];
  level: BlindLevel | null;
  nextLevel: BlindLevel | null;
  remainingMs: number;
  totalMs: number;
  isFinished: boolean;
};

/**
 * Pure, timestamp-based clock computation. Never trust setInterval tick counts —
 * always derive remaining time from wall-clock timestamps so background tabs /
 * throttled timers can't drift the displayed countdown.
 */
export function computeSnapshot(
  levels: BlindLevel[],
  session: SessionState,
  now: number,
): TimerSnapshot {
  const level = levels[session.levelIndex] ?? null;
  const nextLevel = levels[session.levelIndex + 1] ?? null;

  if (session.status === "finished" || !level) {
    return {
      status: "finished",
      level: levels[levels.length - 1] ?? null,
      nextLevel: null,
      remainingMs: 0,
      totalMs: level ? level.durationSeconds * 1000 : 0,
      isFinished: true,
    };
  }

  const totalMs = level.durationSeconds * 1000;

  if (session.status === "paused") {
    return {
      status: "paused",
      level,
      nextLevel,
      remainingMs: session.remainingMsAtPause ?? totalMs,
      totalMs,
      isFinished: false,
    };
  }

  if (session.status === "idle" || session.levelStartedAt === null) {
    return {
      status: "idle",
      level,
      nextLevel,
      remainingMs: totalMs,
      totalMs,
      isFinished: false,
    };
  }

  const elapsed = now - session.levelStartedAt;
  const remainingMs = Math.max(0, totalMs - elapsed);

  return {
    status: "running",
    level,
    nextLevel,
    remainingMs,
    totalMs,
    isFinished: false,
  };
}

/**
 * Advances a running session through every level that has fully elapsed by
 * `now`, carrying the overflow time into the next level so a tournament that
 * goes unwatched for a while (backgrounded tab, screen sleep, brief outage)
 * lands on the *correct* level instead of just +1. Safe to call repeatedly —
 * it's a no-op once nothing is expired. This is the single source of truth
 * for level advancement; clients only render, they never decide to advance.
 */
export function catchUpSession(
  levels: BlindLevel[],
  session: SessionState,
  now: number,
): SessionState {
  if (session.status !== "running" || session.levelStartedAt === null) return session;

  let current = session;
  for (let i = 0; i <= levels.length; i++) {
    const level = levels[current.levelIndex];
    if (!level) {
      return {
        ...current,
        status: "finished",
        levelStartedAt: null,
        remainingMsAtPause: null,
        finishedAt: current.finishedAt ?? now,
        updatedAt: now,
      };
    }

    const totalMs = level.durationSeconds * 1000;
    const elapsed = now - (current.levelStartedAt ?? now);
    if (elapsed < totalMs) return current;

    const overflow = elapsed - totalMs;
    const nextIndex = current.levelIndex + 1;
    if (nextIndex >= levels.length) {
      return {
        ...current,
        status: "finished",
        levelStartedAt: null,
        remainingMsAtPause: null,
        finishedAt: now,
        updatedAt: now,
      };
    }
    current = { ...current, levelIndex: nextIndex, levelStartedAt: now - overflow, updatedAt: now };
  }
  return current;
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Applies a control action to a session, returning the new session state.
 * All timing decisions are made relative to `now` (epoch ms) so the caller
 * (server) controls the authoritative clock.
 */
export function applyAction(
  levels: BlindLevel[],
  session: SessionState,
  action:
    | { type: "start" }
    | { type: "pause" }
    | { type: "resume" }
    | { type: "next" }
    | { type: "prev" }
    | { type: "reset" }
    | { type: "setRemainingTime"; remainingSeconds: number },
  now: number,
): SessionState {
  switch (action.type) {
    case "start": {
      return {
        ...session,
        status: "running",
        levelIndex: 0,
        levelStartedAt: now,
        remainingMsAtPause: null,
        updatedAt: now,
        tournamentStartedAt: now,
        finishedAt: null,
      };
    }
    case "pause": {
      if (session.status !== "running" || session.levelStartedAt === null) return session;
      const snapshot = computeSnapshot(levels, session, now);
      return {
        ...session,
        status: "paused",
        remainingMsAtPause: snapshot.remainingMs,
        levelStartedAt: null,
        updatedAt: now,
      };
    }
    case "resume": {
      if (session.status !== "paused") return session;
      const level = levels[session.levelIndex];
      const totalMs = level ? level.durationSeconds * 1000 : 0;
      const remaining = session.remainingMsAtPause ?? totalMs;
      return {
        ...session,
        status: "running",
        levelStartedAt: now - (totalMs - remaining),
        remainingMsAtPause: null,
        updatedAt: now,
      };
    }
    case "next": {
      const nextIndex = session.levelIndex + 1;
      if (nextIndex >= levels.length) {
        return {
          ...session,
          status: "finished",
          levelStartedAt: null,
          remainingMsAtPause: null,
          updatedAt: now,
          finishedAt: now,
        };
      }
      return {
        ...session,
        status: "running",
        levelIndex: nextIndex,
        levelStartedAt: now,
        remainingMsAtPause: null,
        updatedAt: now,
      };
    }
    case "prev": {
      const prevIndex = Math.max(0, session.levelIndex - 1);
      return {
        ...session,
        status: session.status === "finished" ? "running" : session.status,
        levelIndex: prevIndex,
        levelStartedAt: session.status === "paused" ? null : now,
        remainingMsAtPause:
          session.status === "paused" && levels[prevIndex]
            ? levels[prevIndex].durationSeconds * 1000
            : null,
        updatedAt: now,
      };
    }
    case "reset": {
      return {
        ...session,
        status: "idle",
        levelIndex: 0,
        levelStartedAt: null,
        remainingMsAtPause: null,
        updatedAt: now,
        tournamentStartedAt: null,
        finishedAt: null,
      };
    }
    case "setRemainingTime": {
      const level = levels[session.levelIndex];
      const totalMs = level ? level.durationSeconds * 1000 : 0;
      const remainingMs = Math.max(0, Math.min(totalMs, action.remainingSeconds * 1000));

      if (session.status === "paused") {
        return { ...session, remainingMsAtPause: remainingMs, updatedAt: now };
      }
      if (session.status === "running") {
        return { ...session, levelStartedAt: now - (totalMs - remainingMs), updatedAt: now };
      }
      return session;
    }
    default:
      return session;
  }
}
