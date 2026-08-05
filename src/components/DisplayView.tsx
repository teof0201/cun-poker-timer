"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";
import { useTimerSnapshot } from "@/hooks/useTimerSnapshot";
import { useWakeLock } from "@/hooks/useWakeLock";
import { formatClock } from "@/lib/timerEngine";
import { calculatePrizePool } from "@/lib/prizeCalculator";
import { formatMoney } from "@/lib/formatMoney";

export function DisplayView({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const { tournament, status, error } = useTournamentSocket(tournamentId, "display");
  const snapshot = useTimerSnapshot(tournament);

  useWakeLock();

  useEffect(() => {
    if (tournament?.session.status === "finished") {
      router.push(`/tournament/${tournamentId}/results`);
    }
  }, [tournament?.session.status, tournamentId, router]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      {status !== "connected" || !tournament || !snapshot ? (
        <p className="text-2xl text-zinc-500">
          {status === "denied" ? (error ?? "Không thể tải giải đấu") : "Đang kết nối..."}
        </p>
      ) : (
        <>
          <p className="mb-4 text-2xl text-zinc-400">{tournament.name}</p>
          <p className="text-lg uppercase tracking-widest text-emerald-400">
            {snapshot.level?.isBreak
              ? "Giải lao"
              : `Level ${tournament.session.levelIndex + 1}`}
          </p>
          <p className="font-mono text-[16vw] leading-none font-bold tabular-nums sm:text-[10rem]">
            {formatClock(snapshot.remainingMs)}
          </p>

          {snapshot.level && !snapshot.level.isBreak && (
            <p className="mt-6 text-4xl">
              {snapshot.level.smallBlind.toLocaleString("en-US")} /{" "}
              {snapshot.level.bigBlind.toLocaleString("en-US")}
              {snapshot.level.ante > 0 && (
                <span className="text-zinc-400">
                  {" "}
                  · Ante {snapshot.level.ante.toLocaleString("en-US")}
                </span>
              )}
            </p>
          )}
          {snapshot.nextLevel && (
            <p className="mt-2 text-lg text-zinc-500">
              Tiếp theo:{" "}
              {snapshot.nextLevel.isBreak
                ? "Giải lao"
                : `${snapshot.nextLevel.smallBlind.toLocaleString("en-US")} / ${snapshot.nextLevel.bigBlind.toLocaleString("en-US")}`}
            </p>
          )}

          <div className="mt-10 flex gap-10 text-xl text-zinc-300">
            <span>
              Người chơi:{" "}
              <strong className="text-white">
                {tournament.session.players.filter((p) => p.status === "active").length}
              </strong>{" "}
              / {tournament.session.players.length}
            </span>
            {tournament.freeroll ? (
              <span>
                <strong className="text-white">Freeroll</strong>
              </span>
            ) : (
              <span>
                Quỹ giải thưởng:{" "}
                <strong className="text-white">
                  {formatMoney(
                    calculatePrizePool(
                      tournament.session.players.length,
                      tournament.buyIn,
                      tournament.session.players.reduce((sum, p) => sum + p.rebuys, 0),
                      tournament.rebuyAmount,
                    ),
                  )}
                </strong>
              </span>
            )}
            {tournament.bountyAmount > 0 && (
              <span>
                Bounty:{" "}
                <strong className="text-white">
                  {formatMoney(tournament.bountyAmount * tournament.session.players.length)}
                </strong>
              </span>
            )}
          </div>

          {snapshot.status === "paused" && (
            <p className="mt-8 animate-pulse text-3xl font-semibold text-amber-400">TẠM DỪNG</p>
          )}
          {snapshot.isFinished && (
            <p className="mt-8 text-3xl font-semibold text-emerald-400">GIẢI ĐẤU KẾT THÚC</p>
          )}
        </>
      )}
    </div>
  );
}
