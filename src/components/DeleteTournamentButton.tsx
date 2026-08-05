"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Xóa giải đấu này? Hành động không thể hoàn tác.")) return;
    setBusy(true);
    await fetch(`/api/tournaments/${tournamentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="rounded-full border border-red-500/30 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
    >
      Xóa
    </button>
  );
}
