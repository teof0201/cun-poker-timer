import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnerContext } from "@/lib/tournamentAccess";
import { toPublicTournament } from "@/lib/serialize";
import { createInitialSession } from "@/lib/types";
import { tournamentSettingsSchema } from "@/lib/tournamentSettingsSchema";

export async function GET() {
  const { auth, anonId } = await getOwnerContext();

  const tournaments = await prisma.tournament.findMany({
    where: auth ? { ownerUserId: auth.userId } : { ownerAnonId: anonId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tournaments: tournaments.map(toPublicTournament) });
}

export async function POST(request: Request) {
  const { auth, anonId } = await getOwnerContext();
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

  const tournament = await prisma.tournament.create({
    data: {
      name: input.name,
      buyIn: input.freeroll ? 0 : input.buyIn,
      freeroll: input.freeroll,
      startingStack: input.startingStack,
      levels: JSON.stringify(levels),
      prizeTiers: JSON.stringify(input.prizeTiers),
      session: JSON.stringify(createInitialSession()),
      ownerUserId: auth?.userId ?? null,
      ownerAnonId: auth ? null : anonId,

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

  return NextResponse.json({ tournament: toPublicTournament(tournament) }, { status: 201 });
}
