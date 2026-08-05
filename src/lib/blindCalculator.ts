import type { BlindLevel } from "./types";

// Standard chip denominations poker players actually own — every generated
// blind value snaps to this ladder instead of an arbitrary rounded number.
const CHIP_LADDER = [
  25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000,
  4000, 5000, 6000, 8000, 10000, 15000, 20000, 30000, 40000, 50000, 75000,
  100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000,
];

function snapToChipLadder(value: number): number {
  let closest = CHIP_LADDER[0];
  for (const chip of CHIP_LADDER) {
    if (chip <= value) closest = chip;
    else break;
  }
  return closest;
}

export type BlindStructureInput = {
  startingStack: number;
  numPlayers: number;
  levelDurationMinutes: number;
  numLevels: number;
  breakEveryLevels?: number;
  breakDurationMinutes?: number;
  startWithAnte?: boolean;
};

/**
 * Generates a geometric blind progression from a conservative starting blind
 * up to a target where the average stack is ~10 big blinds (typical
 * end-of-tournament pressure point), snapped to real chip denominations.
 */
export function generateBlindStructure(input: BlindStructureInput): BlindLevel[] {
  const {
    startingStack,
    numPlayers,
    levelDurationMinutes,
    numLevels,
    breakEveryLevels = 6,
    breakDurationMinutes = 15,
    startWithAnte = false,
  } = input;

  const totalChips = startingStack * Math.max(numPlayers, 2);
  const initialBigBlind = snapToChipLadder(Math.max(startingStack / 150, 25));
  const finalBigBlind = snapToChipLadder(totalChips / 10);

  const n = Math.max(numLevels, 1);
  const growth = Math.pow(finalBigBlind / initialBigBlind, 1 / Math.max(n - 1, 1));

  const levels: BlindLevel[] = [];
  let levelCounter = 0;
  let playLevelIndex = 0;

  for (let i = 0; i < n; i++) {
    const rawBB = initialBigBlind * Math.pow(growth, i);
    const bigBlind = snapToChipLadder(rawBB);
    const smallBlind = snapToChipLadder(bigBlind / 2) || Math.round(bigBlind / 2);
    const ante = startWithAnte || i >= Math.floor(n / 3) ? bigBlind : 0;

    levels.push({
      index: levelCounter++,
      smallBlind,
      bigBlind,
      ante,
      durationSeconds: levelDurationMinutes * 60,
      isBreak: false,
    });
    playLevelIndex++;

    if (breakEveryLevels > 0 && playLevelIndex % breakEveryLevels === 0 && i < n - 1) {
      levels.push({
        index: levelCounter++,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        durationSeconds: breakDurationMinutes * 60,
        isBreak: true,
      });
    }
  }

  return levels;
}
