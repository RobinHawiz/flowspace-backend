import { Server } from "socket.io";
import { ServerToClientEvents } from "@customTypes/socket.io.js";

export interface Publisher {}

export default class DefaultPublisher implements Publisher {
  constructor(private readonly io: Server<ServerToClientEvents>) {
    this.io.on("connection", (socket) => {
      console.log("A client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("A client disconnected:", socket.id);
      });
    });
  }

  // TODO: Figure out how to emit to specific users instead of all connected clients

  // TODO: Implement methods for emitting events
}
