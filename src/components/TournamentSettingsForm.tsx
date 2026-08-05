"use client";

import { BlindStructureEditor, type EditableLevel } from "@/components/BlindStructureEditor";
import { PrizeStructureEditor, type EditablePrizeTier } from "@/components/PrizeStructureEditor";

export type TournamentSettingsValue = {
  name: string;
  startingStack: number;
  buyIn: number;
  freeroll: boolean;
  estimatedPlayers: number;
  levels: EditableLevel[];
  allowRebuys: boolean;
  maxRebuys: number;
  rebuyChips: number;
  rebuyAmount: number;
  rebuyUntilLevel: number;
  trackPlayers: boolean;
  bountyAmount: number;
  prizeTiers: EditablePrizeTier[];
};

export function TournamentSettingsForm({
  value,
  onChange,
  onRegenerateBlinds,
  onRegeneratePrizeTiers,
}: {
  value: TournamentSettingsValue;
  onChange: (patch: Partial<TournamentSettingsValue>) => void;
  onRegenerateBlinds: () => void;
  onRegeneratePrizeTiers: () => void;
}) {
  const previewPool = value.freeroll ? 0 : value.buyIn * value.estimatedPlayers;
  return (
    <div className="flex flex-col gap-8">
      <Section number={1} title="Tournament Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên giải đấu" className="sm:col-span-2">
            <input
              required
              value={value.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Stack khởi điểm">
            <input
              type="number"
              min={1}
              value={value.startingStack}
              onChange={(e) => onChange({ startingStack: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Số người chơi dự kiến">
            <input
              type="number"
              min={2}
              value={value.estimatedPlayers}
              onChange={(e) => onChange({ estimatedPlayers: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="Buy-in (đ)">
            <input
              type="number"
              min={0}
              disabled={value.freeroll}
              value={value.buyIn}
              onChange={(e) => onChange({ buyIn: Number(e.target.value) })}
              className="input disabled:opacity-50"
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={value.freeroll}
              onChange={(e) => onChange({ freeroll: e.target.checked })}
            />
            Freeroll? (miễn phí tham gia)
          </label>
        </div>
      </Section>

      <Section number={2} title="Setup Blind Structure">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onRegenerateBlinds}
            className="rounded border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Tự động tạo lại
          </button>
        </div>
        <BlindStructureEditor levels={value.levels} onChange={(levels) => onChange({ levels })} />
      </Section>

      <Section number={3} title="Re-entry & Add-ons">
        <label className="mb-4 flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.allowRebuys}
            onChange={(e) => onChange({ allowRebuys: e.target.checked })}
          />
          Allow Re-entries / Rebuys
        </label>
        {value.allowRebuys && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Max re-entries per player (0 = không giới hạn)">
              <input
                type="number"
                min={0}
                value={value.maxRebuys}
                onChange={(e) => onChange({ maxRebuys: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Re-Entry until Level (0 = không giới hạn)">
              <input
                type="number"
                min={0}
                value={value.rebuyUntilLevel}
                onChange={(e) => onChange({ rebuyUntilLevel: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Reentry Chips">
              <input
                type="number"
                min={1}
                value={value.rebuyChips}
                onChange={(e) => onChange({ rebuyChips: Number(e.target.value) })}
                className="input"
              />
            </Field>
            <Field label="Reentry Price (đ)">
              <input
                type="number"
                min={0}
                value={value.rebuyAmount}
                onChange={(e) => onChange({ rebuyAmount: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>
        )}
      </Section>

      <Section number={4} title="Track Players & Bounties">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.trackPlayers}
            onChange={(e) => onChange({ trackPlayers: e.target.checked })}
          />
          Track Players (khuyên dùng)
        </label>
        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-500">
          <li>Khi bật: mỗi lần thêm người chơi sẽ hỏi tên.</li>
          <li>Khi tắt: thêm người chơi chỉ 1 click, tên tự đặt (Người chơi 1, 2, ...).</li>
          <li>Bust/Rebuy vẫn theo dõi riêng từng người trong cả hai trường hợp.</li>
        </ul>

        <div className="mt-4">
          <Field label="Bounty mỗi người chơi (đ, để 0 nếu không có bounty)">
            <input
              type="number"
              min={0}
              value={value.bountyAmount}
              onChange={(e) => onChange({ bountyAmount: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </div>
      </Section>

      <Section number={5} title="Setup Prize Distribution">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={onRegeneratePrizeTiers}
                className="rounded border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Generate with Calculator
              </button>
            </div>
            <PrizeStructureEditor
              tiers={value.prizeTiers}
              onChange={(prizeTiers) => onChange({ prizeTiers })}
            />
          </div>

          <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <h3 className="mb-1 font-semibold">Distribution Preview</h3>
            <p className="mb-3 text-xs text-zinc-500">
              Ước tính dựa trên buy-in và số người chơi dự kiến.
            </p>
            <p className="mb-3 text-sm">
              Total Prize Pool:{" "}
              <span className="font-semibold">{previewPool.toLocaleString("vi-VN")} đ</span>
            </p>
            <ul className="space-y-1 text-sm">
              {value.prizeTiers.map((tier) => (
                <li key={tier.key} className="flex justify-between">
                  <span>Place {tier.place}</span>
                  <span>
                    {tier.percentage}% ·{" "}
                    {Math.round((previewPool * tier.percentage) / 100).toLocaleString("vi-VN")} đ
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <legend className="flex items-center gap-2 px-1 text-base font-semibold text-emerald-500">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500 text-xs">
          {number}
        </span>
        {title}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="text-zinc-500">{label}</span>
      {children}
    </label>
  );
}
