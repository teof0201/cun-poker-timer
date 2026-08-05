import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOwnerContext } from "@/lib/tournamentAccess";
import { toPublicTournament } from "@/lib/serialize";
import { createInitialSession } from "@/lib/types";
import { generateBlindStructure } from "@/lib/blindCalculator";
import { generatePrizeTiers, suggestedPaidPlaces } from "@/lib/prizeCalculator";

export async function GET() {
  const { auth, anonId } = await getOwnerContext();

  const tournaments = await prisma.tournament.findMany({
    where: auth ? { ownerUserId: auth.userId } : { ownerAnonId: anonId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tournaments: tournaments.map(toPublicTournament) });
}

const schema = z.object({
  name: z.string().min(1).max(120),
  buyIn: z.number().min(0),
  rebuyAmount: z.number().min(0),
  startingStack: z.number().int().min(100),
  levelDurationMinutes: z.number().int().min(1).max(120),
  numLevels: z.number().int().min(1).max(60),
  estimatedPlayers: z.number().int().min(2).max(500),
});

export async function POST(request: Request) {
  const { auth, anonId } = await getOwnerContext();
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const levels = generateBlindStructure({
    startingStack: input.startingStack,
    numPlayers: input.estimatedPlayers,
    levelDurationMinutes: input.levelDurationMinutes,
    numLevels: input.numLevels,
  });
  const prizeTiers = generatePrizeTiers(suggestedPaidPlaces(input.estimatedPlayers));

  const tournament = await prisma.tournament.create({
    data: {
      name: input.name,
      buyIn: input.buyIn,
      rebuyAmount: input.rebuyAmount,
      startingStack: input.startingStack,
      levels: JSON.stringify(levels),
      prizeTiers: JSON.stringify(prizeTiers),
      session: JSON.stringify(createInitialSession()),
      ownerUserId: auth?.userId ?? null,
      ownerAnonId: auth ? null : anonId,
    },
  });

  return NextResponse.json({ tournament: toPublicTournament(tournament) }, { status: 201 });
}
