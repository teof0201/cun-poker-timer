import type { PrizeTier } from "./types";

/**
 * Number of paid places, following the common home-game/casino rule of thumb
 * of paying roughly the top 12-15% of the field (minimum 1, minimum 3 once
 * the field is big enough to support it).
 */
export function suggestedPaidPlaces(numPlayers: number): number {
  if (numPlayers <= 1) return 1;
  if (numPlayers <= 5) return 1;
  if (numPlayers <= 9) return 2;
  const raw = Math.ceil(numPlayers * 0.125);
  return Math.max(3, raw);
}

/**
 * Distributes 100% across `paidPlaces` using a geometric decay so first
 * place earns meaningfully more than the min-cash, then rounds to whole
 * percentage points while keeping the total at exactly 100%.
 */
export function generatePrizeTiers(paidPlaces: number): PrizeTier[] {
  const places = Math.max(1, paidPlaces);
  if (places === 1) return [{ place: 1, percentage: 100 }];

  const decay = 0.62;
  const weights: number[] = [];
  for (let i = 0; i < places; i++) weights.push(Math.pow(decay, i));
  const sum = weights.reduce((a, b) => a + b, 0);

  const raw = weights.map((w) => (w / sum) * 100);
  const rounded = raw.map((v) => Math.round(v));
  const drift = 100 - rounded.reduce((a, b) => a + b, 0);
  rounded[0] += drift; // reconcile rounding error onto first place

  return rounded.map((percentage, i) => ({ place: i + 1, percentage }));
}

export function calculatePrizePool(
  numPlayers: number,
  buyIn: number,
  rebuys: number,
  rebuyAmount: number,
): number {
  return numPlayers * buyIn + rebuys * rebuyAmount;
}
