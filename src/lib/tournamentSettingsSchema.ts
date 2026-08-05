import { z } from "zod";

export const levelSchema = z.object({
  smallBlind: z.number().min(0),
  bigBlind: z.number().min(0),
  ante: z.number().min(0),
  durationSeconds: z.number().int().min(30),
  isBreak: z.boolean(),
});

export const prizeTierSchema = z.object({
  place: z.number().int().min(1),
  percentage: z.number().min(0).max(100),
});

export const tournamentSettingsSchema = z.object({
  name: z.string().min(1).max(120),
  startingStack: z.number().int().min(1),
  buyIn: z.number().min(0),
  freeroll: z.boolean(),
  estimatedPlayers: z.number().int().min(2).max(500),

  levels: z.array(levelSchema).min(1),
  prizeTiers: z
    .array(prizeTierSchema)
    .min(1)
    .refine((tiers) => Math.round(tiers.reduce((sum, t) => sum + t.percentage, 0)) === 100, {
      message: "Tổng phần trăm giải thưởng phải bằng 100%",
    }),

  allowRebuys: z.boolean(),
  maxRebuys: z.number().int().min(0),
  rebuyChips: z.number().int().min(1),
  rebuyAmount: z.number().min(0),
  rebuyUntilLevel: z.number().int().min(0),

  trackPlayers: z.boolean(),
  bountyAmount: z.number().min(0),
});

export type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>;
