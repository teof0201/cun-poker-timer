import { calculatePrizePool } from "./prizeCalculator";
import type { Player, TournamentPublic } from "./types";

export type ResultRow = {
  pos: number;
  player: Player;
  buyIns: number;
  prize: number;
  winLoss: number;
  bustedLevel: number | null;
};

export type TournamentResults = {
  rows: ResultRow[];
  prizePool: number;
  totalEntries: number;
  durationMs: number | null;
};

/**
 * Finishing order: any players still active (normally just the winner) rank
 * first, then eliminated players ordered by how recently they busted — the
 * last player out before the winner takes 2nd, and so on.
 */
export function computeTournamentResults(tournament: TournamentPublic): TournamentResults {
  const players = tournament.session.players;
  const active = players.filter((p) => p.status === "active");
  const eliminated = [...players]
    .filter((p) => p.status === "eliminated")
    .sort((a, b) => (b.bustedAt ?? 0) - (a.bustedAt ?? 0));

  const ordered = [...active, ...eliminated];
  const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
  const prizePool = tournament.freeroll
    ? 0
    : calculatePrizePool(players.length, tournament.buyIn, totalRebuys, tournament.rebuyAmount);

  const rows: ResultRow[] = ordered.map((player, i) => {
    const pos = i + 1;
    const buyIns = tournament.freeroll ? 0 : tournament.buyIn + player.rebuys * tournament.rebuyAmount;
    const tier = tournament.prizeTiers.find((t) => t.place === pos);
    const prize = tier ? Math.round((prizePool * tier.percentage) / 100) : 0;
    return {
      pos,
      player,
      buyIns,
      prize,
      winLoss: prize - buyIns,
      bustedLevel: player.bustedLevel,
    };
  });

  const { tournamentStartedAt, finishedAt } = tournament.session;
  const durationMs =
    tournamentStartedAt !== null && finishedAt !== null ? finishedAt - tournamentStartedAt : null;

  return { rows, prizePool, totalEntries: players.length, durationMs };
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} phút`;
  if (minutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${minutes} phút`;
}
