"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ControlAction, TournamentPublic } from "@/lib/types";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "denied";

export function useTournamentSocket(tournamentId: string, role: "controller" | "display") {
  const [tournament, setTournament] = useState<TournamentPublic | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    function join() {
      setStatus("connecting");
      socket.emit("join", { tournamentId, role }, (result: { ok: boolean; error?: string }) => {
        if (result.ok) {
          setStatus("connected");
          setError(null);
        } else {
          setStatus("denied");
          setError(result.error ?? "Không thể kết nối");
        }
      });
    }

    socket.on("connect", join);
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("state", (payload: TournamentPublic) => setTournament(payload));

    return () => {
      socket.disconnect();
    };
  }, [tournamentId, role]);

  function sendAction(action: ControlAction) {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("action", { tournamentId, action }, (result: { ok: boolean; error?: string }) => {
      if (!result.ok) setError(result.error ?? "Hành động thất bại");
    });
  }

  return { tournament, status, error, sendAction };
}
