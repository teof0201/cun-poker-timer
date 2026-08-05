"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleConfirmDelete() {
    setBusy(true);
    await fetch(`/api/tournaments/${tournamentId}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5 text-sm">
        <span className="text-zinc-400">Xóa luôn?</span>
        <button
          onClick={handleConfirmDelete}
          disabled={busy}
          className="rounded-full bg-red-500 px-3 py-1.5 font-medium text-white hover:bg-red-400 disabled:opacity-50"
        >
          {busy ? "Đang xóa..." : "Xóa"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Hủy
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        setConfirming(true);
        timeoutRef.current = setTimeout(() => setConfirming(false), 4000);
      }}
      className="rounded-full border border-red-500/30 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
    >
      Xóa
    </button>
  );
}
