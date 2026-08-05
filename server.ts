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
import type { ControlAction } from "./src/lib/types";
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
        const tournament = await prisma.tournament.findUnique({
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
        const session = JSON.parse(tournament.session);
        const nextSession = reduceSession(
          levels,
          session,
          payload.action as ControlAction,
          Date.now(),
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
  });

  httpServer.listen(port, () => {
    console.log(
      `> CUN Poker Timer ready on http://localhost:${port} (${dev ? "development" : "production"})`,
    );
  });
});
