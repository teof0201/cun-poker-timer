"use client";

export type EditableLevel = {
  key: string;
  durationMinutes: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  isBreak: boolean;
};

let keyCounter = 0;
export function newLevelKey() {
  keyCounter += 1;
  return `level-${Date.now()}-${keyCounter}`;
}

export function BlindStructureEditor({
  levels,
  onChange,
}: {
  levels: EditableLevel[];
  onChange: (levels: EditableLevel[]) => void;
}) {
  function updateRow(key: string, patch: Partial<EditableLevel>) {
    onChange(levels.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeRow(key: string) {
    onChange(levels.filter((l) => l.key !== key));
  }

  function addLevel() {
    const last = levels[levels.length - 1];
    const smallBlind = last ? last.smallBlind * 2 : 25;
    onChange([
      ...levels,
      {
        key: newLevelKey(),
        durationMinutes: last?.durationMinutes ?? 15,
        smallBlind,
        bigBlind: smallBlind * 2,
        ante: smallBlind * 2,
        isBreak: false,
      },
    ]);
  }

  function addBreak() {
    onChange([
      ...levels,
      {
        key: newLevelKey(),
        durationMinutes: 15,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        isBreak: true,
      },
    ]);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-black/[.04] text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[.06]">
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Thời gian (phút)</th>
              <th className="px-3 py-2">Small Blind</th>
              <th className="px-3 py-2">Big Blind</th>
              <th className="px-3 py-2">Ante</th>
              <th className="px-3 py-2 text-right">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, i) => (
              <tr
                key={level.key}
                className={`border-t border-black/5 dark:border-white/10 ${
                  level.isBreak ? "bg-amber-500/5" : ""
                }`}
              >
                <td className="px-3 py-1.5 font-medium">
                  {level.isBreak ? "Giải lao" : i + 1}
                </td>
                <td className="px-3 py-1.5">
                  <NumberInput
                    value={level.durationMinutes}
                    min={1}
                    onChange={(v) => updateRow(level.key, { durationMinutes: v })}
                  />
                </td>
                <td className="px-3 py-1.5">
                  {level.isBreak ? (
                    <span className="text-zinc-400">—</span>
                  ) : (
                    <NumberInput
                      value={level.smallBlind}
                      min={0}
                      onChange={(v) =>
                        updateRow(level.key, { smallBlind: v, bigBlind: v * 2, ante: v * 2 })
                      }
                    />
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {level.isBreak ? (
                    <span className="text-zinc-400">—</span>
                  ) : (
                    <NumberInput
                      value={level.bigBlind}
                      min={0}
                      onChange={(v) => updateRow(level.key, { bigBlind: v })}
                    />
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {level.isBreak ? (
                    <span className="text-zinc-400">—</span>
                  ) : (
                    <NumberInput
                      value={level.ante}
                      min={0}
                      onChange={(v) => updateRow(level.key, { ante: v })}
                    />
                  )}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(level.key)}
                    className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {levels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  Chưa có level nào — thêm level đầu tiên bên dưới.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 border-t border-black/10 bg-black/[.02] p-2 dark:border-white/10 dark:bg-white/[.03]">
        <button
          type="button"
          onClick={addLevel}
          className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-medium text-black hover:bg-emerald-400"
        >
          + Thêm level
        </button>
        <button
          type="button"
          onClick={addBreak}
          className="rounded border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          + Thêm giải lao
        </button>
      </div>
    </div>
  );
}

function NumberInput({
  value,
  min,
  onChange,
}: {
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-24 rounded border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/15"
    />
  );
}
