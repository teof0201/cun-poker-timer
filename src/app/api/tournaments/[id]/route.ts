import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canAccessTournament, getOwnerContext } from "@/lib/tournamentAccess";
import { toPublicTournament } from "@/lib/serialize";
import { tournamentSettingsSchema } from "@/lib/tournamentSettingsSchema";

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

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  const { auth, anonId } = await getOwnerContext();
  if (!canAccessTournament(tournament, auth, anonId)) {
    return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = tournamentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const levels = input.levels.map((l, index) => ({ ...l, index }));

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      name: input.name,
      buyIn: input.freeroll ? 0 : input.buyIn,
      freeroll: input.freeroll,
      startingStack: input.startingStack,
      levels: JSON.stringify(levels),
      prizeTiers: JSON.stringify(input.prizeTiers),

      allowRebuys: input.allowRebuys,
      maxRebuys: input.maxRebuys,
      rebuyChips: input.rebuyChips,
      rebuyAmount: input.rebuyAmount,
      rebuyUntilLevel: input.rebuyUntilLevel,

      trackPlayers: input.trackPlayers,
      bountyAmount: input.bountyAmount,

      estimatedPlayers: input.estimatedPlayers,
    },
  });

  return NextResponse.json({ tournament: toPublicTournament(updated) });
}
