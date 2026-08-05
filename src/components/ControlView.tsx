"use client";

import { useEffect, useRef, useState } from "react";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";
import { useTimerSnapshot } from "@/hooks/useTimerSnapshot";
import { formatClock } from "@/lib/timerEngine";
import { calculatePrizePool } from "@/lib/prizeCalculator";

export function ControlView({ tournamentId }: { tournamentId: string }) {
  const { tournament, status, error, sendAction } = useTournamentSocket(
    tournamentId,
    "controller",
  );
  const snapshot = useTimerSnapshot(tournament);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [copied, setCopied] = useState(false);
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

  if (status === "connecting") {
    return <p className="p-8 text-center text-zinc-500">Đang kết nối...</p>;
  }
  if (status === "denied") {
    return (
      <p className="p-8 text-center text-red-500">{error ?? "Bạn không có quyền điều khiển giải đấu này"}</p>
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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-sm text-zinc-500">
            Trạng thái: <span className="font-medium">{statusLabel(snapshot.status)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={displayUrl}
            className="w-64 rounded border border-black/10 bg-black/5 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-white/5"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(displayUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
          >
            {copied ? "Đã chép!" : "Chép link màn hình"}
          </button>
        </div>
      </div>

      {error && <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <section className="rounded-2xl border border-black/10 bg-black/[.02] p-8 text-center dark:border-white/10 dark:bg-white/[.03]">
        <p className="text-sm uppercase tracking-wide text-zinc-500">
          {snapshot.level?.isBreak ? "Giải lao" : `Level ${tournament.session.levelIndex + 1}`}
        </p>
        <p className="font-mono text-7xl font-bold tabular-nums">
          {formatClock(snapshot.remainingMs)}
        </p>
        {snapshot.level && !snapshot.level.isBreak && (
          <p className="mt-2 text-lg text-zinc-500">
            Mù {snapshot.level.smallBlind.toLocaleString("vi-VN")} /{" "}
            {snapshot.level.bigBlind.toLocaleString("vi-VN")}
            {snapshot.level.ante > 0 && ` · Ante ${snapshot.level.ante.toLocaleString("vi-VN")}`}
          </p>
        )}
        {snapshot.nextLevel && (
          <p className="mt-1 text-sm text-zinc-400">
            Tiếp theo:{" "}
            {snapshot.nextLevel.isBreak
              ? "Giải lao"
              : `${snapshot.nextLevel.smallBlind.toLocaleString("vi-VN")} / ${snapshot.nextLevel.bigBlind.toLocaleString("vi-VN")}`}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {snapshot.status === "idle" && (
            <ControlButton onClick={() => sendAction({ type: "start" })} primary>
              Bắt đầu
            </ControlButton>
          )}
          {snapshot.status === "running" && (
            <ControlButton onClick={() => sendAction({ type: "pause" })}>Tạm dừng</ControlButton>
          )}
          {snapshot.status === "paused" && (
            <ControlButton onClick={() => sendAction({ type: "resume" })} primary>
              Tiếp tục
            </ControlButton>
          )}
          <ControlButton onClick={() => sendAction({ type: "prev" })}>Level trước</ControlButton>
          <ControlButton onClick={() => sendAction({ type: "next" })}>Level kế</ControlButton>
          <ControlButton onClick={() => sendAction({ type: "reset" })} danger>
            Đặt lại
          </ControlButton>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-3 font-semibold">
            Người chơi ({activePlayers.length} đang chơi / {tournament.session.players.length} tổng)
          </h2>
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPlayerName.trim()) return;
              sendAction({ type: "addPlayer", name: newPlayerName.trim() });
              setNewPlayerName("");
            }}
          >
            <input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Tên người chơi"
              className="flex-1 rounded border border-black/10 bg-transparent px-3 py-1.5 text-sm dark:border-white/15"
            />
            <button
              type="submit"
              className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
            >
              Thêm
            </button>
          </form>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {tournament.session.players.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                  p.status === "eliminated"
                    ? "bg-red-500/5 text-zinc-400 line-through"
                    : "bg-black/[.03] dark:bg-white/[.05]"
                }`}
              >
                <span>
                  {p.name}
                  {p.rebuys > 0 && ` (${p.rebuys} rebuy)`}
                </span>
                <span className="flex gap-1">
                  {p.status === "active" ? (
                    <SmallButton onClick={() => sendAction({ type: "eliminatePlayer", playerId: p.id })}>
                      Bust
                    </SmallButton>
                  ) : (
                    <SmallButton onClick={() => sendAction({ type: "rebuyPlayer", playerId: p.id })}>
                      Rebuy
                    </SmallButton>
                  )}
                  <SmallButton onClick={() => sendAction({ type: "removePlayer", playerId: p.id })}>
                    Xóa
                  </SmallButton>
                </span>
              </li>
            ))}
            {tournament.session.players.length === 0 && (
              <li className="py-2 text-center text-sm text-zinc-500">Chưa có người chơi nào</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="mb-3 font-semibold">Giải thưởng</h2>
          <p className="mb-3 text-sm text-zinc-500">
            Tổng quỹ:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {prizePool.toLocaleString("vi-VN")} đ
            </span>
          </p>
          <ul className="space-y-1 text-sm">
            {tournament.prizeTiers.map((tier) => (
              <li key={tier.place} className="flex justify-between">
                <span>Hạng {tier.place}</span>
                <span>
                  {tier.percentage}% ·{" "}
                  {Math.round((prizePool * tier.percentage) / 100).toLocaleString("vi-VN")} đ
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "idle":
      return "Chưa bắt đầu";
    case "running":
      return "Đang chạy";
    case "paused":
      return "Tạm dừng";
    case "finished":
      return "Đã kết thúc";
    default:
      return status;
  }
}

function ControlButton({
  children,
  onClick,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
        primary
          ? "bg-emerald-500 text-black hover:bg-emerald-400"
          : danger
            ? "border border-red-500/30 text-red-500 hover:bg-red-500/10"
            : "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-black/10 px-1.5 py-0.5 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
