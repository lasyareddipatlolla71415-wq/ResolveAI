import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

export function createNotificationGateway(server: HttpServer) {
  return new Server(server, {
    cors: { origin: process.env.CLIENT_URL ?? "http://localhost:5173" }
  });
}
