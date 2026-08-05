import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOwnerContext } from "@/lib/tournamentAccess";
import { toPublicTournament } from "@/lib/serialize";
import { DeleteTournamentButton } from "@/components/DeleteTournamentButton";
import { formatMoney } from "@/lib/formatMoney";

export default async function TournamentsPage() {
  const { auth, anonId } = await getOwnerContext();

  const rows = await prisma.tournament.findMany({
    where: auth ? { ownerUserId: auth.userId } : { ownerAnonId: anonId ?? "__none__" },
    orderBy: { createdAt: "desc" },
  });
  const tournaments = rows.map(toPublicTournament);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giải đấu của bạn</h1>
        <Link
          href="/tournaments/new"
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
        >
          + Tạo giải đấu mới
        </Link>
      </div>

      {!auth && (
        <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
          Bạn đang dùng chế độ khách — giải đấu chỉ được lưu trên trình duyệt này.{" "}
          <Link href="/register" className="underline">
            Đăng ký
          </Link>{" "}
          để truy cập từ nhiều thiết bị.
        </p>
      )}

      {tournaments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/10 p-10 text-center text-zinc-500 dark:border-white/10">
          Chưa có giải đấu nào. Tạo giải đấu đầu tiên của bạn!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-black/10 p-4 dark:border-white/10"
            >
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-zinc-500">
                  {t.levels.length} levels · Buy-in {formatMoney(t.buyIn)} ·{" "}
                  {t.session.players.length} người chơi
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/tournament/${t.id}/control`}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Điều khiển
                </Link>
                <Link
                  href={`/tournament/${t.id}/display`}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  target="_blank"
                >
                  Màn hình
                </Link>
                <DeleteTournamentButton tournamentId={t.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
