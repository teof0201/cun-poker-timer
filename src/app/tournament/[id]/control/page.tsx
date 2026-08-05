import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { canAccessTournament, getOwnerContext } from "@/lib/tournamentAccess";
import { ControlView } from "@/components/ControlView";

export default async function ControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) notFound();

  const { auth, anonId } = await getOwnerContext();
  if (!canAccessTournament(tournament, auth, anonId)) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <h1 className="text-xl font-semibold">Không có quyền truy cập</h1>
        <p className="mt-2 text-zinc-500">
          Giải đấu này được tạo trên một thiết bị hoặc tài khoản khác.
        </p>
      </div>
    );
  }

  return <ControlView tournamentId={id} />;
}
