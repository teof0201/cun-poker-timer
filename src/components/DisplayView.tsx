"use client";

import { useTournamentSocket } from "@/hooks/useTournamentSocket";
import { useTimerSnapshot } from "@/hooks/useTimerSnapshot";
import { formatClock } from "@/lib/timerEngine";
import { calculatePrizePool } from "@/lib/prizeCalculator";

export function DisplayView({ tournamentId }: { tournamentId: string }) {
  const { tournament, status, error } = useTournamentSocket(tournamentId, "display");
  const snapshot = useTimerSnapshot(tournament);

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
              {snapshot.level.smallBlind.toLocaleString("vi-VN")} /{" "}
              {snapshot.level.bigBlind.toLocaleString("vi-VN")}
              {snapshot.level.ante > 0 && (
                <span className="text-zinc-400">
                  {" "}
                  · Ante {snapshot.level.ante.toLocaleString("vi-VN")}
                </span>
              )}
            </p>
          )}
          {snapshot.nextLevel && (
            <p className="mt-2 text-lg text-zinc-500">
              Tiếp theo:{" "}
              {snapshot.nextLevel.isBreak
                ? "Giải lao"
                : `${snapshot.nextLevel.smallBlind.toLocaleString("vi-VN")} / ${snapshot.nextLevel.bigBlind.toLocaleString("vi-VN")}`}
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
            <span>
              Quỹ giải thưởng:{" "}
              <strong className="text-white">
                {calculatePrizePool(
                  tournament.session.players.length,
                  tournament.buyIn,
                  tournament.session.players.reduce((sum, p) => sum + p.rebuys, 0),
                  tournament.rebuyAmount,
                ).toLocaleString("vi-VN")}{" "}
                đ
              </strong>
            </span>
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
