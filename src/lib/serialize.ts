import type { Tournament } from "@prisma/client";
import type { TournamentPublic } from "./types";

export function toPublicTournament(row: Tournament): TournamentPublic {
  return {
    id: row.id,
    name: row.name,
    buyIn: row.buyIn,
    rebuyAmount: row.rebuyAmount,
    startingStack: row.startingStack,
    levels: JSON.parse(row.levels),
    prizeTiers: JSON.parse(row.prizeTiers),
    session: JSON.parse(row.session),
  };
}
