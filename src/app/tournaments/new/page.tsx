"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { newLevelKey } from "@/components/BlindStructureEditor";
import { newPrizeKey } from "@/components/PrizeStructureEditor";
import {
  TournamentSettingsForm,
  type TournamentSettingsValue,
} from "@/components/TournamentSettingsForm";
import { generateBlindStructure } from "@/lib/blindCalculator";
import { generatePrizeTiers, suggestedPaidPlaces } from "@/lib/prizeCalculator";
import { DEFAULT_TOURNAMENT_PRESET, type TournamentPreset } from "@/lib/tournamentPreset";
import { loadLastTournamentSettings, saveLastTournamentSettings } from "@/lib/lastTournamentSettings";

function presetToSettingsValue(preset: TournamentPreset): TournamentSettingsValue {
  return {
    name: preset.name,
    startingStack: preset.startingStack,
    buyIn: preset.buyIn,
    freeroll: preset.freeroll,
    estimatedPlayers: preset.estimatedPlayers,
    levels: preset.levels.map((l) => ({
      key: newLevelKey(),
      durationMinutes: Math.round(l.durationSeconds / 60),
      smallBlind: l.smallBlind,
      bigBlind: l.bigBlind,
      ante: l.ante,
      isBreak: l.isBreak,
    })),
    prizeTiers: preset.prizeTiers.map((t) => ({
      key: newPrizeKey(),
      place: t.place,
      percentage: t.percentage,
    })),
    allowRebuys: preset.allowRebuys,
    maxRebuys: preset.maxRebuys,
    rebuyChips: preset.rebuyChips,
    rebuyAmount: preset.rebuyAmount,
    rebuyUntilLevel: preset.rebuyUntilLevel,
    trackPlayers: preset.trackPlayers,
    bountyAmount: preset.bountyAmount,
  };
}

function settingsValueToPreset(value: TournamentSettingsValue): TournamentPreset {
  return {
    name: value.name,
    startingStack: value.startingStack,
    buyIn: value.buyIn,
    freeroll: value.freeroll,
    estimatedPlayers: value.estimatedPlayers,
    levels: value.levels.map((l, index) => ({
      index,
      smallBlind: l.smallBlind,
      bigBlind: l.bigBlind,
      ante: l.ante,
      durationSeconds: l.durationMinutes * 60,
      isBreak: l.isBreak,
    })),
    prizeTiers: value.prizeTiers.map((t) => ({ place: t.place, percentage: t.percentage })),
    allowRebuys: value.allowRebuys,
    maxRebuys: value.maxRebuys,
    rebuyChips: value.rebuyChips,
    rebuyAmount: value.rebuyAmount,
    rebuyUntilLevel: value.rebuyUntilLevel,
    trackPlayers: value.trackPlayers,
    bountyAmount: value.bountyAmount,
  };
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TournamentSettingsValue>(() =>
    presetToSettingsValue(DEFAULT_TOURNAMENT_PRESET),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Loading from localStorage must happen post-hydration to avoid SSR mismatch.
  useEffect(() => {
    function loadSavedSettings() {
      setSettings(presetToSettingsValue(loadLastTournamentSettings()));
    }
    loadSavedSettings();
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (settings.levels.length === 0) {
      setError("Cần ít nhất 1 level trong cấu trúc blind");
      return;
    }
    const totalPercentage = settings.prizeTiers.reduce((sum, t) => sum + t.percentage, 0);
    if (settings.prizeTiers.length === 0 || Math.round(totalPercentage) !== 100) {
      setError("Tổng phần trăm giải thưởng phải bằng 100%");
      return;
    }
    setBusy(true);
    setError(null);

    const res = await fetch("/api/tournaments", {
      method: "POST",
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
      setError(data.error ?? "Tạo giải đấu thất bại");
      setBusy(false);
      return;
    }
    saveLastTournamentSettings(settingsValueToPreset(settings));
    router.push(`/tournament/${data.tournament.id}/control`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Tạo giải đấu mới</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Cài đặt bên dưới được điền sẵn từ giải đấu gần nhất — kiểm tra lại rồi mới tạo.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <TournamentSettingsForm
          value={settings}
          onChange={patch}
          onRegenerateBlinds={regenerateBlinds}
          onRegeneratePrizeTiers={regeneratePrizeTiers}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-500 px-4 py-2.5 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Đang tạo..." : "Tạo giải đấu"}
        </button>
      </form>
    </div>
  );
}
