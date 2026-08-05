import type { Tournament } from "@prisma/client";
import type { TournamentPublic } from "./types";

export function toPublicTournament(row: Tournament): TournamentPublic {
  return {
    id: row.id,
    name: row.name,
    buyIn: row.buyIn,
    freeroll: row.freeroll,
    startingStack: row.startingStack,
    levels: JSON.parse(row.levels),
    prizeTiers: JSON.parse(row.prizeTiers),
    session: JSON.parse(row.session),

    allowRebuys: row.allowRebuys,
    maxRebuys: row.maxRebuys,
    rebuyChips: row.rebuyChips,
    rebuyAmount: row.rebuyAmount,
    rebuyUntilLevel: row.rebuyUntilLevel,

    trackPlayers: row.trackPlayers,
    bountyAmount: row.bountyAmount,

    estimatedPlayers: row.estimatedPlayers,
  };
}
