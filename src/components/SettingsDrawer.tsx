"use client";

import { useState } from "react";
import type { ControlAction, TournamentPublic } from "@/lib/types";
import { PlayerManager } from "./PlayerManager";
import { newLevelKey } from "./BlindStructureEditor";
import { newPrizeKey } from "./PrizeStructureEditor";
import { TournamentSettingsForm, type TournamentSettingsValue } from "./TournamentSettingsForm";
import { generateBlindStructure } from "@/lib/blindCalculator";
import { generatePrizeTiers, suggestedPaidPlaces } from "@/lib/prizeCalculator";
import { saveLastTournamentSettings } from "@/lib/lastTournamentSettings";
import { computeSnapshot } from "@/lib/timerEngine";

function tournamentToSettingsValue(t: TournamentPublic): TournamentSettingsValue {
  return {
    name: t.name,
    startingStack: t.startingStack,
    buyIn: t.buyIn,
    freeroll: t.freeroll,
    estimatedPlayers: t.estimatedPlayers,
    levels: t.levels.map((l) => ({
      key: newLevelKey(),
      durationMinutes: Math.round(l.durationSeconds / 60),
      smallBlind: l.smallBlind,
      bigBlind: l.bigBlind,
      ante: l.ante,
      isBreak: l.isBreak,
    })),
    prizeTiers: t.prizeTiers.map((tier) => ({
      key: newPrizeKey(),
      place: tier.place,
      percentage: tier.percentage,
    })),
    allowRebuys: t.allowRebuys,
    maxRebuys: t.maxRebuys,
    rebuyChips: t.rebuyChips,
    rebuyAmount: t.rebuyAmount,
    rebuyUntilLevel: t.rebuyUntilLevel,
    trackPlayers: t.trackPlayers,
    bountyAmount: t.bountyAmount,
  };
}

export function SettingsDrawer({
  tournament,
  sendAction,
  onClose,
  onSaved,
}: {
  tournament: TournamentPublic;
  sendAction: (action: ControlAction) => void;
  onClose: () => void;
  /** Called after settings are saved so the caller can push a socket refresh. */
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"players" | "settings">("players");
  const [settings, setSettings] = useState<TournamentSettingsValue>(() =>
    tournamentToSettingsValue(tournament),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<TournamentSettingsValue>) {
    setSettings((s) => ({ ...s, ...p }));
  }

  function regenerateBlinds() {
    patch({
      levels: generateBlindStructure({
        startingStack: settings.startingStack,
        numPlayers: settings.estimatedPlayers,
        levelDurationMinutes: settings.levels[0]?.durationMinutes ?? 15,
        numLevels: 10,
        breakEveryLevels: 0,
      }).map((l) => ({
        key: newLevelKey(),
        durationMinutes: Math.round(l.durationSeconds / 60),
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
        isBreak: l.isBreak,
      })),
    });
  }

  function regeneratePrizeTiers() {
    patch({
      prizeTiers: generatePrizeTiers(suggestedPaidPlaces(settings.estimatedPlayers)).map((t) => ({
        key: newPrizeKey(),
        place: t.place,
        percentage: t.percentage,
      })),
    });
  }

  async function handleSave() {
    if (settings.levels.length === 0) {
      setError("Cần ít nhất 1 level trong cấu trúc blind");
      return;
    }
    const totalPercentage = settings.prizeTiers.reduce((sum, t) => sum + t.percentage, 0);
    if (settings.prizeTiers.length === 0 || Math.round(totalPercentage) !== 100) {
      setError("Tổng phần trăm giải thưởng phải bằng 100%");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/tournaments/${tournament.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        levels: settings.levels.map((l) => ({
          smallBlind: l.smallBlind,
          bigBlind: l.bigBlind,
          ante: l.ante,
          durationSeconds: l.durationMinutes * 60,
          isBreak: l.isBreak,
        })),
        prizeTiers: settings.prizeTiers.map((t) => ({ place: t.place, percentage: t.percentage })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Lưu cài đặt thất bại");
      setSaving(false);
      return;
    }
    setSaving(false);
    saveLastTournamentSettings({
      name: settings.name,
      startingStack: settings.startingStack,
      buyIn: settings.buyIn,
      freeroll: settings.freeroll,
      estimatedPlayers: settings.estimatedPlayers,
      levels: settings.levels.map((l, index) => ({
        index,
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
        durationSeconds: l.durationMinutes * 60,
        isBreak: l.isBreak,
      })),
      prizeTiers: settings.prizeTiers.map((t) => ({ place: t.place, percentage: t.percentage })),
      allowRebuys: settings.allowRebuys,
      maxRebuys: settings.maxRebuys,
      rebuyChips: settings.rebuyChips,
      rebuyAmount: settings.rebuyAmount,
      rebuyUntilLevel: settings.rebuyUntilLevel,
      trackPlayers: settings.trackPlayers,
      bountyAmount: settings.bountyAmount,
    });
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex bg-black/70" onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-6 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Cài đặt</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-black/10 px-3 py-1 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Đóng
          </button>
        </div>

        <TimeAdjustSlider tournament={tournament} sendAction={sendAction} />

        <div className="mb-4 flex gap-1 border-b border-black/10 dark:border-white/10">
          <TabButton active={tab === "players"} onClick={() => setTab("players")}>
            Manage Player
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
            Cài đặt giải đấu
          </TabButton>
        </div>

        {tab === "players" ? (
          <PlayerManager tournament={tournament} sendAction={sendAction} />
        ) : (
          <div className="flex flex-col gap-4 pb-6">
            <TournamentSettingsForm
              value={settings}
              onChange={patch}
              onRegenerateBlinds={regenerateBlinds}
              onRegeneratePrizeTiers={regeneratePrizeTiers}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-emerald-500 px-4 py-2.5 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeAdjustSlider({
  tournament,
  sendAction,
}: {
  tournament: TournamentPublic;
  sendAction: (action: ControlAction) => void;
}) {
  const level = tournament.levels[tournament.session.levelIndex];
  const maxMinutes = level ? Math.max(1, Math.round(level.durationSeconds / 60)) : 15;

  const [minutes, setMinutes] = useState(() => {
    const remainingMinutes = Math.round(
      computeSnapshot(tournament.levels, tournament.session, Date.now()).remainingMs / 60000,
    );
    return Math.min(maxMinutes, Math.max(0, remainingMinutes));
  });

  const canApply = tournament.session.status === "running" || tournament.session.status === "paused";

  function apply() {
    if (!canApply) return;
    sendAction({ type: "setRemainingTime", remainingSeconds: minutes * 60 });
  }

  return (
    <div className="mb-4 rounded-xl border border-black/10 p-3 dark:border-white/10">
      <div className="mb-1 flex items-center justify-between text-sm font-medium">
        <span>Chỉnh giờ level hiện tại</span>
        <span className="text-emerald-500">{minutes} phút</span>
      </div>
      <input
        type="range"
        min={0}
        max={maxMinutes}
        step={1}
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="w-full"
        disabled={!canApply}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">0 → {maxMinutes} phút</span>
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className="rounded bg-emerald-500 px-3 py-1 text-xs font-medium text-black hover:bg-emerald-400 disabled:opacity-40"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? "border-emerald-500 text-emerald-500"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}
