import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@customTypes/socket.io.js";
import { WorkspaceResponse } from "@models/workspace.js";

export interface Publisher {
  emitCreateWorkspace(
    appUserId: number,
    workspace: WorkspaceResponse,
    clientRequestId: string,
  ): void;

  emitUpdateWorkspace(
    appUserId: number,
    workspaceId: number,
    workspaceTitle: string,
    clientRequestId: string,
  ): void;

  emitDeleteWorkspace(
    appUserId: number,
    workspaceId: number,
    clientRequestId: string,
  ): void;
}

export default class DefaultPublisher implements Publisher {
  constructor(
    private readonly io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {}

  emitCreateWorkspace(
    appUserId: number,
    workspace: WorkspaceResponse,
    clientRequestId: string,
  ) {
    this.io
      .to(`user:${appUserId}`)
      .emit("workspace:created", workspace, clientRequestId);
  }

  emitUpdateWorkspace(
    appUserId: number,
    workspaceId: number,
    workspaceTitle: string,
    clientRequestId: string,
  ) {
    this.io
      .to(`workspace:${workspaceId}`)
      .to(`user:${appUserId}`)
      .emit("workspace:updated", workspaceId, workspaceTitle, clientRequestId);
  }

  emitDeleteWorkspace(
    appUserId: number,
    workspaceId: number,
    clientRequestId: string,
  ) {
    this.io
      .to(`workspace:${workspaceId}`)
      .to(`user:${appUserId}`)
      .emit("workspace:deleted", workspaceId, clientRequestId);
  }
}
