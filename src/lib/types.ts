export type BlindLevel = {
  index: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationSeconds: number;
  isBreak: boolean;
};

export type PrizeTier = {
  place: number;
  percentage: number;
};

export type PlayerStatus = "active" | "eliminated";

export type Player = {
  id: string;
  name: string;
  status: PlayerStatus;
  rebuys: number;
  addOns: number;
};

export type TournamentStatus = "idle" | "running" | "paused" | "finished";

export type SessionState = {
  status: TournamentStatus;
  levelIndex: number;
  /** epoch ms when the current level clock started running; null when idle/paused */
  levelStartedAt: number | null;
  /** remaining ms in the current level, captured at the moment of pausing */
  remainingMsAtPause: number | null;
  players: Player[];
  updatedAt: number;
};

export type TournamentConfig = {
  id: string;
  name: string;
  buyIn: number;
  freeroll: boolean;
  startingStack: number;
  levels: BlindLevel[];
  prizeTiers: PrizeTier[];

  allowRebuys: boolean;
  maxRebuys: number; // 0 = unlimited
  rebuyChips: number;
  rebuyAmount: number;
  rebuyUntilLevel: number; // 0 = no cutoff

  trackPlayers: boolean;
  bountyAmount: number;

  estimatedPlayers: number;
};

export type TournamentPublic = TournamentConfig & {
  session: SessionState;
};

export function createInitialSession(): SessionState {
  return {
    status: "idle",
    levelIndex: 0,
    levelStartedAt: null,
    remainingMsAtPause: null,
    players: [],
    updatedAt: Date.now(),
  };
}

export type ControlAction =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "reset" }
  | { type: "addPlayer"; name?: string }
  | { type: "eliminatePlayer"; playerId: string }
  | { type: "removePlayer"; playerId: string }
  | { type: "rebuyPlayer"; playerId: string };
