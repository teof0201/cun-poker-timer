import type { ControlAction, TournamentPublic } from "./types";

export type JoinPayload = {
  tournamentId: string;
  role: "controller" | "display";
};

export type ClientToServerEvents = {
  join: (payload: JoinPayload, ack: (result: { ok: boolean; error?: string }) => void) => void;
  action: (
    payload: { tournamentId: string; action: ControlAction },
    ack: (result: { ok: boolean; error?: string }) => void,
  ) => void;
  /** Re-broadcasts current DB state to the room — used after settings are saved via REST. */
  refresh: (
    payload: { tournamentId: string },
    ack: (result: { ok: boolean; error?: string }) => void,
  ) => void;
};

export type ServerToClientEvents = {
  state: (tournament: TournamentPublic) => void;
  error: (message: string) => void;
};
