"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";
import { useTimerSnapshot } from "@/hooks/useTimerSnapshot";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useBeepPlayer } from "@/hooks/useBeepPlayer";
import { useCountdownWarning } from "@/hooks/useCountdownWarning";
import { formatClock } from "@/lib/timerEngine";
import { calculatePrizePool } from "@/lib/prizeCalculator";
import { formatMoney } from "@/lib/formatMoney";

export function DisplayView({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const { tournament, status, error } = useTournamentSocket(tournamentId, "display");
  const snapshot = useTimerSnapshot(tournament);
  const beepPlayer = useBeepPlayer();
  const isWarning = useCountdownWarning(
    snapshot,
    tournament?.session.levelStartedAt ?? null,
    beepPlayer.play,
  );

  useWakeLock();

  useEffect(() => {
    if (tournament?.session.status === "finished") {
      router.push(`/tournament/${tournamentId}/results`);
    }
    // snapshot?.isFinished re-runs this check every 250ms as a safety net in
    // case a single "state" socket event is ever missed.
  }, [tournament?.session.status, snapshot?.isFinished, tournamentId, router]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-white text-zinc-900 py-6 dark:bg-black dark:text-white">
      <button
        onClick={() => {
          beepPlayer.unlock();
          beepPlayer.setEnabled(!beepPlayer.enabled);
        }}
        title={beepPlayer.enabled ? "Tắt âm thanh" : "Bật âm thanh"}
        aria-label={beepPlayer.enabled ? "Tắt âm thanh" : "Bật âm thanh"}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg border border-black/20 text-lg text-zinc-900 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
      >
        {beepPlayer.enabled ? "🔊" : "🔇"}
      </button>

      {status !== "connected" || !tournament || !snapshot ? (
        <p className="text-2xl text-zinc-500">
          {status === "denied" ? (error ?? "Không thể tải giải đấu") : "Đang kết nối..."}
        </p>
      ) : (
        <>
          <p className="mb-4 text-2xl text-zinc-500 dark:text-zinc-400">{tournament.name}</p>
          <p className="text-lg uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {snapshot.level?.isBreak
              ? "Giải lao"
              : `Level ${tournament.session.levelIndex + 1}`}
          </p>
          <p
            className="font-mono text-[16vw] leading-none font-bold tabular-nums sm:text-[10rem]"
            style={isWarning ? { color: "var(--timer-warning)" } : undefined}
          >
            {formatClock(snapshot.remainingMs)}
          </p>

          {snapshot.level && !snapshot.level.isBreak && (
            <p className="mt-6 text-4xl">
              {snapshot.level.smallBlind.toLocaleString("en-US")} /{" "}
              {snapshot.level.bigBlind.toLocaleString("en-US")}
              {snapshot.level.ante > 0 && (
                <span className="text-zinc-500 dark:text-zinc-400">
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

          <div className="mt-10 flex gap-10 text-xl text-zinc-600 dark:text-zinc-300">
            <span>
              Người chơi:{" "}
              <strong className="text-zinc-900 dark:text-white">
                {tournament.session.players.filter((p) => p.status === "active").length}
              </strong>{" "}
              / {tournament.session.players.length}
            </span>
            {tournament.freeroll ? (
              <span>
                <strong className="text-zinc-900 dark:text-white">Freeroll</strong>
              </span>
            ) : (
              <span>
                Quỹ giải thưởng:{" "}
                <strong className="text-zinc-900 dark:text-white">
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
                <strong className="text-zinc-900 dark:text-white">
                  {formatMoney(tournament.bountyAmount * tournament.session.players.length)}
                </strong>
              </span>
            )}
          </div>

          {snapshot.status === "paused" && (
            <p className="mt-8 animate-pulse text-3xl font-semibold text-amber-600 dark:text-amber-400">TẠM DỪNG</p>
          )}
          {snapshot.isFinished && (
            <p className="mt-8 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">GIẢI ĐẤU KẾT THÚC</p>
          )}
        </>
      )}
    </div>
  );
}
