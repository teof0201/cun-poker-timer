"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTournamentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "Giải đấu Poker",
    buyIn: 100000,
    rebuyAmount: 100000,
    startingStack: 10000,
    levelDurationMinutes: 15,
    numLevels: 12,
    estimatedPlayers: 9,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Tạo giải đấu mới</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Tên giải đấu">
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Buy-in (đ)">
            <input
              type="number"
              min={0}
              value={form.buyIn}
              onChange={(e) => update("buyIn", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Rebuy (đ)">
            <input
              type="number"
              min={0}
              value={form.rebuyAmount}
              onChange={(e) => update("rebuyAmount", Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Stack khởi điểm">
            <input
              type="number"
              min={100}
              value={form.startingStack}
              onChange={(e) => update("startingStack", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Số người chơi dự kiến">
            <input
              type="number"
              min={2}
              value={form.estimatedPlayers}
              onChange={(e) => update("estimatedPlayers", Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Thời gian mỗi level (phút)">
            <input
              type="number"
              min={1}
              value={form.levelDurationMinutes}
              onChange={(e) => update("levelDurationMinutes", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Số lượng level">
            <input
              type="number"
              min={1}
              value={form.numLevels}
              onChange={(e) => update("numLevels", Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-full bg-emerald-500 px-4 py-2.5 font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? "Đang tạo..." : "Tạo giải đấu"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
