import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@customTypes/socket.io.js";
import type { CorsOptions } from "@config/cors.js";

export default function createWebSocket(server: HttpServer, cors: CorsOptions) {
  return new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(server, { cors });
}
