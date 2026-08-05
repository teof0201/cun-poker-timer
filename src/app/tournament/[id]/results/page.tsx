import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toPublicTournament } from "@/lib/serialize";
import { computeTournamentResults, formatDuration } from "@/lib/tournamentResults";
import { formatMoney } from "@/lib/formatMoney";
import { PrintButton } from "@/components/PrintButton";

function formatFinishedAt(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.tournament.findUnique({ where: { id } });
  if (!row) notFound();

  const tournament = toPublicTournament(row);
  const { rows, prizePool, totalEntries, durationMs } = computeTournamentResults(tournament);
  const winner = rows[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:py-0">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-sm print:border-0 print:shadow-none">
        <div className="px-8 pt-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide">TOURNAMENT RESULTS</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {tournament.name}
            {tournament.session.finishedAt &&
              ` · ${formatFinishedAt(tournament.session.finishedAt)}`}
          </p>
        </div>

        {winner && (
          <div className="mx-8 mt-6 rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 px-6 py-6 text-center shadow-inner">
            <div className="text-4xl">🏆</div>
            <p className="mt-1 text-xs font-bold tracking-[0.2em] text-amber-950/70">WINNER</p>
            <p className="text-2xl font-extrabold text-amber-950">{winner.player.name}</p>
            <p className="text-lg font-semibold text-amber-950/80">{formatMoney(winner.prize)}</p>
          </div>
        )}

        <div className="mt-8 px-8">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Final Results
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-800 text-left text-white">
                  <th className="px-3 py-2 font-medium">Pos</th>
                  <th className="px-3 py-2 font-medium">Player Name</th>
                  <th className="px-3 py-2 font-medium">Buyins</th>
                  <th className="px-3 py-2 font-medium">Prize</th>
                  <th className="px-3 py-2 font-medium">Win/Loss</th>
                  <th className="px-3 py-2 font-medium">Busted Level</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.player.id}
                    className={
                      r.pos === 1
                        ? "bg-amber-100"
                        : r.pos === 2
                          ? "bg-zinc-200/70"
                          : r.pos === 3
                            ? "bg-orange-100/70"
                            : r.pos % 2 === 0
                              ? "bg-zinc-50"
                              : "bg-white"
                    }
                  >
                    <td className="px-3 py-2 font-semibold">{r.pos}</td>
                    <td className="px-3 py-2 font-medium">{r.player.name}</td>
                    <td className="px-3 py-2">{formatMoney(r.buyIns)}</td>
                    <td className="px-3 py-2">{formatMoney(r.prize)}</td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        r.winLoss > 0
                          ? "text-emerald-600"
                          : r.winLoss < 0
                            ? "text-red-500"
                            : "text-zinc-500"
                      }`}
                    >
                      {r.winLoss > 0 ? "+" : ""}
                      {formatMoney(r.winLoss)}
                    </td>
                    <td className="px-3 py-2">{r.bustedLevel ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 px-8 pb-8">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            Tournament Summary
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 text-sm">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <td className="px-3 py-2 font-medium text-zinc-500">Tournament Length</td>
                  <td className="px-3 py-2 text-right">
                    {durationMs !== null ? formatDuration(durationMs) : "-"}
                  </td>
                </tr>
                <tr className="border-b border-zinc-200">
                  <td className="px-3 py-2 font-medium text-zinc-500">Total Entries</td>
                  <td className="px-3 py-2 text-right">{totalEntries}</td>
                </tr>
                <tr className="bg-zinc-50">
                  <td className="px-3 py-2 font-medium text-zinc-500">Total Prize Pool</td>
                  <td className="px-3 py-2 text-right font-semibold">{formatMoney(prizePool)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3 print:hidden">
        <Link
          href="/tournaments"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Về danh sách giải đấu
        </Link>
        <PrintButton />
      </div>
    </div>
  );
}
