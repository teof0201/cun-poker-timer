"use client";

import { useEffect, useRef, useState } from "react";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";
import { useTimerSnapshot } from "@/hooks/useTimerSnapshot";
import { formatClock } from "@/lib/timerEngine";
import { calculatePrizePool } from "@/lib/prizeCalculator";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import type { BlindLevel } from "@/lib/types";

function formatBlinds(level: BlindLevel) {
  return `${level.smallBlind.toLocaleString("vi-VN")} / ${level.bigBlind.toLocaleString("vi-VN")} / ${level.ante.toLocaleString("vi-VN")}`;
}

export function ControlView({ tournamentId }: { tournamentId: string }) {
  const { tournament, status, error, sendAction, refresh } = useTournamentSocket(
    tournamentId,
    "controller",
  );
  const snapshot = useTimerSnapshot(tournament);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const autoAdvancedForLevel = useRef<number | null>(null);
  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tournament/${tournamentId}/display`
      : "";

  useEffect(() => {
    if (!snapshot || !tournament) return;
    if (
      snapshot.status === "running" &&
      snapshot.remainingMs <= 0 &&
      autoAdvancedForLevel.current !== tournament.session.levelIndex
    ) {
      autoAdvancedForLevel.current = tournament.session.levelIndex;
      sendAction({ type: "next" });
    }
  }, [snapshot, tournament, sendAction]);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  if (status === "connecting") {
    return <p className="p-8 text-center text-zinc-500">Đang kết nối...</p>;
  }
  if (status === "denied") {
    return (
      <p className="p-8 text-center text-red-500">
        {error ?? "Bạn không có quyền điều khiển giải đấu này"}
      </p>
    );
  }
  if (!tournament || !snapshot) {
    return <p className="p-8 text-center text-zinc-500">Đang tải dữ liệu giải đấu...</p>;
  }

  const activePlayers = tournament.session.players.filter((p) => p.status === "active");
  const totalRebuys = tournament.session.players.reduce((sum, p) => sum + p.rebuys, 0);
  const prizePool = calculatePrizePool(
    tournament.session.players.length,
    tournament.buyIn,
    totalRebuys,
    tournament.rebuyAmount,
  );
  const totalChipsInPlay =
    tournament.session.players.length * tournament.startingStack + totalRebuys * tournament.rebuyChips;
  const averageStack = activePlayers.length > 0 ? Math.round(totalChipsInPlay / activePlayers.length) : 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-black text-white">
      {/* top bar: name + utility actions */}
      <div className="flex shrink-0 items-center justify-between px-6 pt-4">
        <div />
        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={() => sendAction({ type: "reset" })}
            className="rounded border border-white/15 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
          >
            Đặt lại
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(displayUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded border border-white/15 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
          >
            {copied ? "Đã chép!" : "Chép link màn hình"}
          </button>
        </div>
      </div>

      {/* 3-column main info */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto px-8 pt-4 sm:grid-cols-3">
        {/* Left: prize pool */}
        <div className="text-left">
          {tournament.freeroll ? (
            <h2 className="text-3xl font-bold">Freeroll</h2>
          ) : (
            <h2 className="text-3xl font-bold">
              Prize pool {prizePool.toLocaleString("vi-VN")} đ
            </h2>
          )}
          <ul className="mt-3 space-y-1 text-sm font-semibold">
            {tournament.prizeTiers.map((tier) => (
              <li key={tier.place} className="flex justify-between gap-6">
                <span>Hạng {tier.place}</span>
                <span>{Math.round((prizePool * tier.percentage) / 100).toLocaleString("vi-VN")} đ</span>
              </li>
            ))}
          </ul>
          {tournament.bountyAmount > 0 && (
            <p className="mt-4 text-sm text-zinc-400">
              Bounty: {(tournament.bountyAmount * tournament.session.players.length).toLocaleString("vi-VN")} đ
              <span className="text-zinc-500"> ({tournament.bountyAmount.toLocaleString("vi-VN")} đ/người)</span>
            </p>
          )}
        </div>

        {/* Center: clock */}
        <div className="flex flex-col items-center text-center">
          <p className="text-2xl font-bold">{tournament.name}</p>
          <p className="mt-2 text-xl font-semibold">
            {snapshot.level?.isBreak ? "Giải lao" : `Level ${tournament.session.levelIndex + 1}`}
          </p>
          <p className="font-mono text-6xl font-bold tabular-nums sm:text-7xl lg:text-8xl">
            {formatClock(snapshot.remainingMs)}
          </p>

          {snapshot.level && !snapshot.level.isBreak && (
            <>
              <p className="mt-2 text-lg text-zinc-400">Blinds</p>
              <p className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                {formatBlinds(snapshot.level)}
              </p>
            </>
          )}

          {snapshot.nextLevel && (
            <>
              <p className="mt-4 text-zinc-400">Coming up</p>
              <p className="text-2xl font-bold">
                {snapshot.nextLevel.isBreak ? "Giải lao" : formatBlinds(snapshot.nextLevel)}
              </p>
            </>
          )}

          {snapshot.status === "paused" && (
            <p className="mt-4 animate-pulse text-2xl font-semibold text-amber-400">TẠM DỪNG</p>
          )}
          {snapshot.isFinished && (
            <p className="mt-4 text-2xl font-semibold text-emerald-400">GIẢI ĐẤU KẾT THÚC</p>
          )}
        </div>

        {/* Right: entries + buy-ins */}
        <div className="text-left sm:text-right">
          <h2 className="text-2xl font-bold">Entries</h2>
          <p className="mt-2">Total Entries: {tournament.session.players.length}</p>
          <p>Players Left: {activePlayers.length}</p>
          <p>Rebuys: {totalRebuys}</p>

          <h2 className="mt-6 text-2xl font-bold">Buy-ins & Re-Entry</h2>
          <p className="mt-2">
            Buy-In: {tournament.freeroll ? "Freeroll" : `${tournament.buyIn.toLocaleString("vi-VN")} đ`}
          </p>
          <p>Starting Stack: {tournament.startingStack.toLocaleString("vi-VN")}</p>
          <p>
            Re-Entry until Level:{" "}
            {tournament.rebuyUntilLevel > 0 ? tournament.rebuyUntilLevel : "Không giới hạn"}
          </p>
          <p>Average Stacks: {averageStack.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      {/* bottom control bar */}
      <div className="flex shrink-0 items-center justify-center gap-3 pb-8 pt-4">
        <IconButton label="Cài đặt" onClick={() => setSettingsOpen(true)}>
          ☰
        </IconButton>

        {snapshot.status !== "idle" && (
          <IconButton label="Level trước" onClick={() => sendAction({ type: "prev" })}>
            ‹
          </IconButton>
        )}

        {snapshot.status === "idle" && (
          <MainButton onClick={() => sendAction({ type: "start" })}>▶ Start Tournament</MainButton>
        )}
        {snapshot.status === "running" && (
          <MainButton onClick={() => sendAction({ type: "pause" })}>⏸ Pause</MainButton>
        )}
        {snapshot.status === "paused" && (
          <MainButton onClick={() => sendAction({ type: "resume" })}>▶ Resume</MainButton>
        )}
        {snapshot.status === "finished" && (
          <MainButton onClick={() => sendAction({ type: "reset" })}>↺ Đặt lại giải đấu</MainButton>
        )}

        {snapshot.status !== "idle" && (
          <IconButton label="Level kế" onClick={() => sendAction({ type: "next" })}>
            ›
          </IconButton>
        )}

        <IconButton label="Toàn màn hình" onClick={toggleFullscreen}>
          ⛶
        </IconButton>
      </div>

      {settingsOpen && (
        <SettingsDrawer
          tournament={tournament}
          sendAction={sendAction}
          onClose={() => setSettingsOpen(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function MainButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-400"
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10"
    >
      {children}
    </button>
  );
}
