import type { BlindLevel, PrizeTier } from "./types";

export type TournamentPreset = {
  name: string;
  startingStack: number;
  buyIn: number;
  freeroll: boolean;
  estimatedPlayers: number;
  levels: BlindLevel[];
  prizeTiers: PrizeTier[];
  allowRebuys: boolean;
  maxRebuys: number;
  rebuyChips: number;
  rebuyAmount: number;
  rebuyUntilLevel: number;
  trackPlayers: boolean;
  bountyAmount: number;
};

const FIFTEEN_MIN = 15 * 60;

/**
 * The organizer's standard home-game setup. Used to seed a brand new
 * browser/account's first tournament, and as the fallback if the
 * last-used settings can't be read (e.g. private browsing).
 */
export const DEFAULT_TOURNAMENT_PRESET: TournamentPreset = {
  name: "Giải đấu Poker",
  startingStack: 200,
  buyIn: 50000,
  freeroll: false,
  estimatedPlayers: 9,
  levels: [
    { index: 0, smallBlind: 1, bigBlind: 2, ante: 2, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 1, smallBlind: 2, bigBlind: 4, ante: 4, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 2, smallBlind: 4, bigBlind: 8, ante: 8, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 3, smallBlind: 7, bigBlind: 14, ante: 14, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 4, smallBlind: 10, bigBlind: 20, ante: 20, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 5, smallBlind: 15, bigBlind: 30, ante: 30, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 6, smallBlind: 25, bigBlind: 50, ante: 50, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 7, smallBlind: 40, bigBlind: 80, ante: 80, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 8, smallBlind: 70, bigBlind: 140, ante: 140, durationSeconds: FIFTEEN_MIN, isBreak: false },
    { index: 9, smallBlind: 125, bigBlind: 250, ante: 250, durationSeconds: FIFTEEN_MIN, isBreak: false },
  ],
  prizeTiers: [
    { place: 1, percentage: 50 },
    { place: 2, percentage: 30 },
    { place: 3, percentage: 20 },
  ],
  allowRebuys: true,
  maxRebuys: 0,
  rebuyChips: 200,
  rebuyAmount: 50000,
  rebuyUntilLevel: 5,
  trackPlayers: true,
  bountyAmount: 0,
};
