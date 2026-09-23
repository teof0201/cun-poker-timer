"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTournamentSocket } from "@/hooks/useTournamentSocket";
import { useTimerSnapshot } from "@/hooks/useTimerSnapshot";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useBeepPlayer } from "@/hooks/useBeepPlayer";
import { useCountdownWarning } from "@/hooks/useCountdownWarning";
import { formatClock } from "@/lib/timerEngine";
import { calculatePrizePool } from "@/lib/prizeCalculator";
import { formatMoney } from "@/lib/formatMoney";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import type { BlindLevel } from "@/lib/types";

function formatBlinds(level: BlindLevel) {
  return `${level.smallBlind.toLocaleString("en-US")} / ${level.bigBlind.toLocaleString("en-US")} / ${level.ante.toLocaleString("en-US")}`;
}

export function ControlView({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantsReopen = searchParams.get("reopen") === "1";
  const reopenSentRef = useRef(false);
  const { tournament, status, error, sendAction, refresh } = useTournamentSocket(
    tournamentId,
    "controller",
  );
  const snapshot = useTimerSnapshot(tournament);
  const beepPlayer = useBeepPlayer();
  const isWarning = useCountdownWarning(
    snapshot,
    tournament?.session.levelStartedAt ?? null,
    beepPlayer.play,
    beepPlayer.playLong,
  );
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tournament/${tournamentId}/display`
      : "";

  useWakeLock();

  function sendActionWithAudioUnlock(action: Parameters<typeof sendAction>[0]) {
    // Start/Pause/Resume are real user gestures — piggyback on them to
    // satisfy the browser's autoplay policy well before the first beep
    // (which only fires 5 seconds before a level ends) is ever needed.
    beepPlayer.unlock();
    sendAction(action);
  }

  // Level advancement on timeout is decided by the server (see server.ts's
  // catch-up sweep) — the client only renders whatever state it's given.
  // Do not re-add a client-side "remainingMs <= 0 -> send next" effect here:
  // a backgrounded/throttled tab can't be trusted to fire it reliably, and a
  // second source of truth racing the server caused levels to double-skip.

  useEffect(() => {
    if (!tournament) return;

    if (tournament.session.status === "finished") {
      // Arrived via the results page's "sửa kết quả" link: un-finish instead
      // of bouncing straight back to /results, so a mistaken final
      // elimination can be corrected (undoBust) before the tournament
      // re-finishes for real. Keep the ?reopen=1 marker in the URL until the
      // server actually confirms the switch away from "finished" — the
      // socket round-trip isn't instant, and clearing it any earlier races
      // this same effect into redirecting to /results before reopen lands.
      if (wantsReopen) {
        if (!reopenSentRef.current) {
          reopenSentRef.current = true;
          sendAction({ type: "reopen" });
        }
        return;
      }
      router.push(`/tournament/${tournamentId}/results`);
      return;
    }

    if (reopenSentRef.current) {
      reopenSentRef.current = false;
      router.replace(`/tournament/${tournamentId}/control`);
    }
    // snapshot.isFinished (recomputed every 250ms by useTimerSnapshot) is a
    // deliberate extra trigger here — belt-and-suspenders in case a single
    // "state" socket event is ever missed, this re-checks shortly after.
  }, [tournament, snapshot?.isFinished, wantsReopen, tournamentId, router, sendAction]);

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
    <div className="fixed inset-0 z-40 overflow-y-auto bg-white text-zinc-900 dark:bg-black dark:text-white">
      <div className="flex min-h-full flex-col py-4">
      {/* top bar: name + utility actions */}
      <div className="flex shrink-0 items-center justify-between px-6">
        <div />
        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <button
            onClick={() => sendAction({ type: "reset" })}
            className="rounded border border-black/15 px-2 py-1 text-xs text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Đặt lại
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(displayUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded border border-black/15 px-2 py-1 text-xs text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            {copied ? "Đã chép!" : "Chép link màn hình"}
          </button>
        </div>
      </div>

      {/* 3-column main info — center column carries the most weight */}
      <div className="grid flex-1 grid-cols-1 items-center gap-6 px-8 py-6 sm:grid-cols-[1fr_1.4fr_1fr]">
        {/* Left: prize pool */}
        <div className="text-left text-sm">
          {tournament.freeroll ? (
            <h2 className="text-xl font-bold">Freeroll</h2>
          ) : (
            <h2 className="text-xl font-bold">Prize pool {formatMoney(prizePool)}</h2>
          )}
          <ul className="mt-3 space-y-1 font-semibold">
            {tournament.prizeTiers.map((tier) => (
              <li key={tier.place} className="flex gap-2">
                <span>Hạng {tier.place}:</span>
                <span>{formatMoney((prizePool * tier.percentage) / 100)}</span>
              </li>
            ))}
          </ul>
          {tournament.bountyAmount > 0 && (
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              Bounty: {formatMoney(tournament.bountyAmount * tournament.session.players.length)}
              <span className="text-zinc-400 dark:text-zinc-500">
                {" "}
                ({formatMoney(tournament.bountyAmount)}/người)
              </span>
            </p>
          )}
        </div>

        {/* Center: clock — the focal point of the screen */}
        <div className="flex flex-col items-center text-center">
          <p className="text-2xl font-bold sm:text-3xl">{tournament.name}</p>
          <p className="mt-2 text-xl font-semibold sm:text-2xl">
            {snapshot.level?.isBreak ? "Giải lao" : `Level ${tournament.session.levelIndex + 1}`}
          </p>
          <p
            className="font-mono text-7xl font-bold tabular-nums sm:text-8xl lg:text-9xl"
            style={isWarning ? { color: "var(--timer-warning)" } : undefined}
          >
            {formatClock(snapshot.remainingMs)}
          </p>

          {snapshot.level && !snapshot.level.isBreak && (
            <>
              <p className="mt-2 text-lg text-zinc-500 sm:text-xl dark:text-zinc-400">Blinds</p>
              <p className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                {formatBlinds(snapshot.level)}
              </p>
            </>
          )}

          {snapshot.nextLevel && (
            <>
              <p className="mt-4 text-zinc-500 dark:text-zinc-400">Coming up</p>
              <p className="text-2xl font-bold sm:text-3xl">
                {snapshot.nextLevel.isBreak ? "Giải lao" : formatBlinds(snapshot.nextLevel)}
              </p>
            </>
          )}

          {snapshot.status === "paused" && (
            <p className="mt-4 animate-pulse text-2xl font-semibold text-amber-600 dark:text-amber-400">TẠM DỪNG</p>
          )}
          {snapshot.isFinished && (
            <p className="mt-4 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">GIẢI ĐẤU KẾT THÚC</p>
          )}
        </div>

        {/* Right: entries + buy-ins */}
        <div className="text-left text-sm sm:text-right">
          <h2 className="text-xl font-bold">Entries</h2>
          <p className="mt-2">Total Entries: {tournament.session.players.length}</p>
          <p>Players Left: {activePlayers.length}</p>
          <p>Rebuys: {totalRebuys}</p>

          <h2 className="mt-6 text-xl font-bold">Buy-ins & Re-Entry</h2>
          <p className="mt-2">
            Buy-In: {tournament.freeroll ? "Freeroll" : formatMoney(tournament.buyIn)}
          </p>
          <p>Starting Stack: {tournament.startingStack.toLocaleString("en-US")}</p>
          <p>
            Re-Entry until Level:{" "}
            {tournament.rebuyUntilLevel > 0 ? tournament.rebuyUntilLevel : "Không giới hạn"}
          </p>
          <p>Average Stacks: {averageStack.toLocaleString("en-US")}</p>
        </div>
      </div>

      {/* bottom control bar */}
      <div className="flex shrink-0 items-center justify-center gap-3 pt-4">
        <IconButton label="Cài đặt" onClick={() => setSettingsOpen(true)}>
          ☰
        </IconButton>

        {snapshot.status !== "idle" && (
          <IconButton label="Level trước" onClick={() => sendAction({ type: "prev" })}>
            ‹
          </IconButton>
        )}

        {snapshot.status === "idle" && (
          <MainButton onClick={() => sendActionWithAudioUnlock({ type: "start" })}>▶ Start Tournament</MainButton>
        )}
        {snapshot.status === "running" && (
          <MainButton onClick={() => sendActionWithAudioUnlock({ type: "pause" })}>⏸ Pause</MainButton>
        )}
        {snapshot.status === "paused" && (
          <MainButton onClick={() => sendActionWithAudioUnlock({ type: "resume" })}>▶ Resume</MainButton>
        )}
        {snapshot.status === "finished" && (
          <MainButton onClick={() => sendAction({ type: "reset" })}>↺ Đặt lại giải đấu</MainButton>
        )}

        {snapshot.status !== "idle" && (
          <IconButton label="Level kế" onClick={() => sendAction({ type: "next" })}>
            ›
          </IconButton>
        )}

        <IconButton
          label={beepPlayer.enabled ? "Tắt âm thanh" : "Bật âm thanh"}
          onClick={() => {
            beepPlayer.unlock();
            beepPlayer.setEnabled(!beepPlayer.enabled);
          }}
        >
          {beepPlayer.enabled ? "🔊" : "🔇"}
        </IconButton>

        <IconButton label="Toàn màn hình" onClick={toggleFullscreen}>
          ⛶
        </IconButton>
      </div>
      </div>

      {isWarning && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: "var(--timer-warning-overlay)" }}
        />
      )}

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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/20 text-zinc-900 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
