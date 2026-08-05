"use client";

import { useState } from "react";
import type { ControlAction, TournamentPublic } from "@/lib/types";

export function PlayerManager({
  tournament,
  sendAction,
}: {
  tournament: TournamentPublic;
  sendAction: (action: ControlAction) => void;
}) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const activePlayers = tournament.session.players.filter((p) => p.status === "active");

  function canRebuy(rebuys: number) {
    if (!tournament.allowRebuys) return false;
    if (tournament.maxRebuys > 0 && rebuys >= tournament.maxRebuys) return false;
    if (tournament.rebuyUntilLevel > 0 && tournament.session.levelIndex >= tournament.rebuyUntilLevel)
      return false;
    return true;
  }

  return (
    <div>
      <h2 className="mb-3 font-semibold">
        Người chơi ({activePlayers.length} đang chơi / {tournament.session.players.length} tổng)
      </h2>

      {tournament.trackPlayers ? (
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
      ) : (
        <button
          onClick={() => sendAction({ type: "addPlayer" })}
          className="mb-3 w-full rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
        >
          + Thêm người chơi
        </button>
      )}

      <ul className="max-h-96 space-y-1 overflow-y-auto">
        {tournament.session.players.map((p) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
              p.status === "eliminated" ? "bg-red-500/5" : "bg-black/[.03] dark:bg-white/[.05]"
            }`}
          >
            <span className={p.status === "eliminated" ? "text-zinc-400 line-through" : ""}>
              {p.name}
              {p.rebuys > 0 && ` (${p.rebuys} rebuy)`}
            </span>
            <span className="flex gap-1">
              {p.status === "active" ? (
                <SmallButton onClick={() => sendAction({ type: "eliminatePlayer", playerId: p.id })}>
                  Bust
                </SmallButton>
              ) : (
                canRebuy(p.rebuys) && (
                  <SmallButton onClick={() => sendAction({ type: "rebuyPlayer", playerId: p.id })}>
                    Rebuy
                  </SmallButton>
                )
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
