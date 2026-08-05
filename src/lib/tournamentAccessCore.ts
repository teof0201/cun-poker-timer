import type { Tournament } from "@prisma/client";

export function canAccessTournament(
  tournament: Pick<Tournament, "ownerUserId" | "ownerAnonId">,
  auth: { userId: string } | null,
  anonId: string | null,
): boolean {
  if (auth && tournament.ownerUserId === auth.userId) return true;
  if (!tournament.ownerUserId && anonId && tournament.ownerAnonId === anonId) return true;
  return false;
}
