import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPublicTournament } from "@/lib/serialize";

/**
 * Unauthenticated read of tournament config + session, for display screens
 * (e.g. a TV in the room) that only have the share link, not an account.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }
  return NextResponse.json({ tournament: toPublicTournament(tournament) });
}
