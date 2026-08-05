import { DEFAULT_TOURNAMENT_PRESET, type TournamentPreset } from "./tournamentPreset";

const STORAGE_KEY = "cun_last_tournament_settings";

/** Reads the organizer's most recently used tournament settings from this browser. */
export function loadLastTournamentSettings(): TournamentPreset {
  if (typeof window === "undefined") return DEFAULT_TOURNAMENT_PRESET;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOURNAMENT_PRESET;
    return { ...DEFAULT_TOURNAMENT_PRESET, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TOURNAMENT_PRESET;
  }
}

/** Remembers these settings so the next "new tournament" starts from them. */
export function saveLastTournamentSettings(preset: TournamentPreset) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.) — not critical.
  }
}
