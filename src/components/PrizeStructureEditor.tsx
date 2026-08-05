"use client";

export type EditablePrizeTier = {
  key: string;
  place: number;
  percentage: number;
};

let keyCounter = 0;
export function newPrizeKey() {
  keyCounter += 1;
  return `prize-${Date.now()}-${keyCounter}`;
}

export function PrizeStructureEditor({
  tiers,
  onChange,
}: {
  tiers: EditablePrizeTier[];
  onChange: (tiers: EditablePrizeTier[]) => void;
}) {
  const total = tiers.reduce((sum, t) => sum + t.percentage, 0);

  function updateRow(key: string, percentage: number) {
    onChange(tiers.map((t) => (t.key === key ? { ...t, percentage } : t)));
  }

  function removeRow(key: string) {
    onChange(
      tiers
        .filter((t) => t.key !== key)
        .map((t, i) => ({ ...t, place: i + 1 })),
    );
  }

  function addRow() {
    onChange([...tiers, { key: newPrizeKey(), place: tiers.length + 1, percentage: 0 }]);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/[.04] text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[.06]">
            <th className="px-3 py-2">Place</th>
            <th className="px-3 py-2">Prize (%)</th>
            <th className="px-3 py-2 text-right">Xóa</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.key} className="border-t border-black/5 dark:border-white/10">
              <td className="px-3 py-1.5 font-medium">{tier.place}</td>
              <td className="px-3 py-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tier.percentage}
                  onChange={(e) => updateRow(tier.key, Number(e.target.value))}
                  className="w-24 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/15"
                />
              </td>
              <td className="px-3 py-1.5 text-right">
                <button
                  type="button"
                  onClick={() => removeRow(tier.key)}
                  className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
          {tiers.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                Chưa có hạng giải nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-2 border-t border-black/10 bg-black/[.02] p-2 dark:border-white/10 dark:bg-white/[.03]">
        <button
          type="button"
          onClick={addRow}
          className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
        >
          + Thêm hạng
        </button>
        <span
          className={`px-2 text-sm font-medium ${
            Math.round(total) === 100 ? "text-emerald-500" : "text-amber-500"
          }`}
        >
          Tổng: {total}%
        </span>
      </div>
    </div>
  );
}
