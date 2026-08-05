"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { newLevelKey, type EditableLevel } from "@/components/BlindStructureEditor";
import { newPrizeKey, type EditablePrizeTier } from "@/components/PrizeStructureEditor";
import {
  TournamentSettingsForm,
  type TournamentSettingsValue,
} from "@/components/TournamentSettingsForm";
import { generateBlindStructure } from "@/lib/blindCalculator";
import { generatePrizeTiers, suggestedPaidPlaces } from "@/lib/prizeCalculator";

function prizeTiersToEditable(
  tiers: ReturnType<typeof generatePrizeTiers>,
): EditablePrizeTier[] {
  return tiers.map((t) => ({ key: newPrizeKey(), place: t.place, percentage: t.percentage }));
}

function blindLevelsToEditable(
  levels: ReturnType<typeof generateBlindStructure>,
): EditableLevel[] {
  return levels.map((l) => ({
    key: newLevelKey(),
    durationMinutes: Math.round(l.durationSeconds / 60),
    smallBlind: l.smallBlind,
    bigBlind: l.bigBlind,
    ante: l.ante,
    isBreak: l.isBreak,
  }));
}

function defaultSettings(): TournamentSettingsValue {
  return {
    name: "Giải đấu Poker",
    startingStack: 10000,
    buyIn: 100000,
    freeroll: false,
    estimatedPlayers: 9,
    levels: blindLevelsToEditable(
      generateBlindStructure({
        startingStack: 10000,
        numPlayers: 9,
        levelDurationMinutes: 15,
        numLevels: 10,
        breakEveryLevels: 0,
      }),
    ),
    prizeTiers: prizeTiersToEditable(generatePrizeTiers(suggestedPaidPlaces(9))),
    allowRebuys: true,
    maxRebuys: 0,
    rebuyChips: 10000,
    rebuyAmount: 100000,
    rebuyUntilLevel: 0,
    trackPlayers: true,
    bountyAmount: 0,
  };
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TournamentSettingsValue>(defaultSettings);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function patch(p: Partial<TournamentSettingsValue>) {
    setSettings((s) => ({ ...s, ...p }));
  }

  function regenerateBlinds() {
    patch({
      levels: blindLevelsToEditable(
        generateBlindStructure({
          startingStack: settings.startingStack,
          numPlayers: settings.estimatedPlayers,
          levelDurationMinutes: settings.levels[0]?.durationMinutes ?? 15,
          numLevels: 10,
          breakEveryLevels: 0,
        }),
      ),
    });
  }

  function regeneratePrizeTiers() {
    patch({
      prizeTiers: prizeTiersToEditable(
        generatePrizeTiers(suggestedPaidPlaces(settings.estimatedPlayers)),
      ),
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
    router.push(`/tournament/${data.tournament.id}/control`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Tạo giải đấu mới</h1>
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
