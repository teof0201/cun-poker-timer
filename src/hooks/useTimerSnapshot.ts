"use client";

import { useEffect, useState } from "react";
import { computeSnapshot, type TimerSnapshot } from "@/lib/timerEngine";
import type { TournamentPublic } from "@/lib/types";

export function useTimerSnapshot(tournament: TournamentPublic | null): TimerSnapshot | null {
  const [snapshot, setSnapshot] = useState<TimerSnapshot | null>(null);

  useEffect(() => {
    if (!tournament) return;

    function tick() {
      if (!tournament) return;
      setSnapshot(computeSnapshot(tournament.levels, tournament.session, Date.now()));
    }

    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, [tournament]);

  return tournament ? snapshot : null;
}
