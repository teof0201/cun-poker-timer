import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAccessTournament, getOwnerContext } from "@/lib/tournamentAccess";
import { toPublicTournament } from "@/lib/serialize";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  const { auth, anonId } = await getOwnerContext();
  if (!canAccessTournament(tournament, auth, anonId)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  return NextResponse.json({ tournament: toPublicTournament(tournament) });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  const { auth, anonId } = await getOwnerContext();
  if (!canAccessTournament(tournament, auth, anonId)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  await prisma.tournament.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
