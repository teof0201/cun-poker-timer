import "dotenv/config";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./src/lib/db";
import { ANON_COOKIE, AUTH_COOKIE, verifyAuthToken } from "./src/lib/authCore";
import { parseCookieHeader } from "./src/lib/parseCookies";
import { canAccessTournament } from "./src/lib/tournamentAccessCore";
import { toPublicTournament } from "./src/lib/serialize";
import { reduceSession } from "./src/lib/sessionReducer";
import { catchUpSession } from "./src/lib/timerEngine";
import type { BlindLevel, ControlAction, SessionState } from "./src/lib/types";
import type {
  ClientToServerEvents,
  JoinPayload,
  ServerToClientEvents,
} from "./src/lib/socketEvents";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

type SocketData = {
  tournamentId?: string;
  role?: JoinPayload["role"];
};

const CATCH_UP_INTERVAL_MS = 1000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData>(
    httpServer,
    { path: "/socket.io" },
  );

  io.on("connection", (socket) => {
    const requestCookies = parseCookieHeader(socket.handshake.headers.cookie);
    const authToken = requestCookies[AUTH_COOKIE];
    const anonId = requestCookies[ANON_COOKIE] ?? null;
    const auth = authToken ? verifyAuthToken(authToken) : null;

    socket.on("join", async (payload, ack) => {
      try {
        let tournament = await prisma.tournament.findUnique({
          where: { id: payload.tournamentId },
        });
        if (!tournament) {
          ack?.({ ok: false, error: "Không tìm thấy giải đấu" });
          return;
        }
        if (payload.role === "controller" && !canAccessTournament(tournament, auth, anonId)) {
          ack?.({ ok: false, error: "Không có quyền điều khiển giải đấu này" });
          return;
        }

        // Catch the clock up in case it wasn't watched while a level expired
        // (backgrounded tab, sleeping screen, brief outage) before sending state.
        const levels: BlindLevel[] = JSON.parse(tournament.levels);
        const session: SessionState = JSON.parse(tournament.session);
        const caughtUp = catchUpSession(levels, session, Date.now());
        if (caughtUp !== session) {
          tournament = await prisma.tournament.update({
            where: { id: payload.tournamentId },
            data: { session: JSON.stringify(caughtUp) },
          });
        }

        socket.data.tournamentId = payload.tournamentId;
        socket.data.role = payload.role;
        socket.join(`tournament:${payload.tournamentId}`);
        socket.emit("state", toPublicTournament(tournament));
        ack?.({ ok: true });
      } catch (err) {
        console.error("[socket:join] error", err);
        ack?.({ ok: false, error: "Lỗi máy chủ" });
      }
    });

    socket.on("action", async (payload, ack) => {
      try {
        if (
          socket.data.role !== "controller" ||
          socket.data.tournamentId !== payload.tournamentId
        ) {
          ack?.({ ok: false, error: "Không có quyền" });
          return;
        }

        const tournament = await prisma.tournament.findUnique({
          where: { id: payload.tournamentId },
        });
        if (!tournament) {
          ack?.({ ok: false, error: "Không tìm thấy giải đấu" });
          return;
        }
        if (!canAccessTournament(tournament, auth, anonId)) {
          ack?.({ ok: false, error: "Không có quyền điều khiển giải đấu này" });
          return;
        }

        const levels = JSON.parse(tournament.levels);
        const now = Date.now();
        const session = catchUpSession(levels, JSON.parse(tournament.session), now);
        const nextSession = reduceSession(
          {
            levels,
            maxRebuys: tournament.maxRebuys,
            rebuyUntilLevel: tournament.rebuyUntilLevel,
          },
          session,
          payload.action as ControlAction,
          now,
        );

        const updated = await prisma.tournament.update({
          where: { id: payload.tournamentId },
          data: { session: JSON.stringify(nextSession) },
        });

        io.to(`tournament:${payload.tournamentId}`).emit("state", toPublicTournament(updated));
        ack?.({ ok: true });
      } catch (err) {
        console.error("[socket:action] error", err);
        ack?.({ ok: false, error: "Lỗi máy chủ" });
      }
    });

    socket.on("refresh", async (payload, ack) => {
      try {
        if (socket.data.tournamentId !== payload.tournamentId) {
          ack?.({ ok: false, error: "Không có quyền" });
          return;
        }

        const tournament = await prisma.tournament.findUnique({
          where: { id: payload.tournamentId },
        });
        if (!tournament) {
          ack?.({ ok: false, error: "Không tìm thấy giải đấu" });
          return;
        }

        io.to(`tournament:${payload.tournamentId}`).emit("state", toPublicTournament(tournament));
        ack?.({ ok: true });
      } catch (err) {
        console.error("[socket:refresh] error", err);
        ack?.({ ok: false, error: "Lỗi máy chủ" });
      }
    });
  });

  // Single source of truth for level advancement: sweep every running
  // tournament on a fixed clock so blinds always move forward on time, even
  // if nobody's browser tab is open/foregrounded to notice.
  setInterval(async () => {
    try {
      const rows = await prisma.tournament.findMany();
      const now = Date.now();
      for (const row of rows) {
        let session: SessionState;
        try {
          session = JSON.parse(row.session);
        } catch {
          continue;
        }
        if (session.status !== "running") continue;

        const levels: BlindLevel[] = JSON.parse(row.levels);
        const caughtUp = catchUpSession(levels, session, now);
        if (caughtUp.levelIndex === session.levelIndex && caughtUp.status === session.status) {
          continue;
        }

        const updated = await prisma.tournament.update({
          where: { id: row.id },
          data: { session: JSON.stringify(caughtUp) },
        });
        io.to(`tournament:${row.id}`).emit("state", toPublicTournament(updated));
      }
    } catch (err) {
      console.error("[catch-up sweep] error", err);
    }
  }, CATCH_UP_INTERVAL_MS);

  httpServer.listen(port, () => {
    console.log(
      `> CUN Poker Timer ready on http://localhost:${port} (${dev ? "development" : "production"})`,
    );
  });
});
