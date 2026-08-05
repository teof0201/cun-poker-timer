import { randomUUID } from "crypto";
import { applyAction as applyTimingAction } from "./timerEngine";
import type { BlindLevel, ControlAction, Player, SessionState } from "./types";

export type SessionReducerConfig = {
  levels: BlindLevel[];
  maxRebuys: number; // 0 = unlimited
  rebuyUntilLevel: number; // 0 = no cutoff
};

export function reduceSession(
  config: SessionReducerConfig,
  session: SessionState,
  action: ControlAction,
  now: number,
): SessionState {
  const { levels, maxRebuys, rebuyUntilLevel } = config;

  switch (action.type) {
    case "start":
    case "pause":
    case "resume":
    case "next":
    case "prev":
    case "reset":
      return applyTimingAction(levels, session, action, now);

    case "addPlayer": {
      const name = action.name?.trim() || `Người chơi ${session.players.length + 1}`;
      const player: Player = {
        id: randomUUID(),
        name,
        status: "active",
        rebuys: 0,
        addOns: 0,
        bustedLevel: null,
        bustedAt: null,
      };
      return { ...session, players: [...session.players, player], updatedAt: now };
    }

    case "eliminatePlayer": {
      const players = session.players.map((p) =>
        p.id === action.playerId
          ? { ...p, status: "eliminated" as const, bustedLevel: session.levelIndex + 1, bustedAt: now }
          : p,
      );

      // Heads-up down to one survivor ends the tournament outright — there's
      // no one left to play against, regardless of the rebuy window.
      const activeCount = players.filter((p) => p.status === "active").length;
      const justFinished = players.length >= 2 && activeCount === 1;

      return {
        ...session,
        players,
        updatedAt: now,
        status: justFinished ? "finished" : session.status,
        levelStartedAt: justFinished ? null : session.levelStartedAt,
        remainingMsAtPause: justFinished ? null : session.remainingMsAtPause,
        finishedAt: justFinished ? now : session.finishedAt,
      };
    }

    case "removePlayer":
      return {
        ...session,
        players: session.players.filter((p) => p.id !== action.playerId),
        updatedAt: now,
      };

    case "rebuyPlayer": {
      // Rebuying immediately buys the player back into the tournament —
      // no confirmation, no re-entering the amount (fixed at tournament setup).
      const player = session.players.find((p) => p.id === action.playerId);
      if (!player) return session;
      if (maxRebuys > 0 && player.rebuys >= maxRebuys) return session;
      if (rebuyUntilLevel > 0 && session.levelIndex >= rebuyUntilLevel) return session;

      return {
        ...session,
        players: session.players.map((p) =>
          p.id === action.playerId
            ? { ...p, status: "active", rebuys: p.rebuys + 1, bustedLevel: null, bustedAt: null }
            : p,
        ),
        updatedAt: now,
      };
    }

    default:
      return session;
  }
}
