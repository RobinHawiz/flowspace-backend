import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@customTypes/socket.io.js";
import {
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from "@models/workspace.js";

export interface Publisher {
  emitAddMemberWorkspace(
    workspace: WorkspaceResponse,
    addedMember: WorkspaceMemberResponse,
    callerAppUserId: string,
    clientRequestId: string,
  ): void;

  emitCreateWorkspace(
    appUserId: string,
    workspace: WorkspaceResponse,
    clientRequestId: string,
  ): void;

  emitUpdateWorkspace(
    appUserId: string,
    workspaceId: string,
    workspaceTitle: string,
    clientRequestId: string,
  ): void;

  emitDeleteWorkspace(
    appUserId: string,
    workspaceId: string,
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

  emitAddMemberWorkspace(
    workspace: WorkspaceResponse,
    addedMember: WorkspaceMemberResponse,
    callerAppUserId: string,
    clientRequestId: string,
  ) {
    // Notify the added member about being added to the workspace.
    this.io
      .to(`user:${addedMember.id}`)
      .emit("workspace:membershipAdded", workspace);

    // Notify existing workspace members about the new member.
    this.io
      .to(`user:${callerAppUserId}`)
      .to(`workspace:${workspace.id}`)
      .emit(
        "workspace:memberAdded",
        workspace.id,
        addedMember,
        clientRequestId,
      );
  }

  emitCreateWorkspace(
    appUserId: string,
    workspace: WorkspaceResponse,
    clientRequestId: string,
  ) {
    this.io
      .to(`user:${appUserId}`)
      .emit("workspace:created", workspace, clientRequestId);
  }

  emitUpdateWorkspace(
    appUserId: string,
    workspaceId: string,
    workspaceTitle: string,
    clientRequestId: string,
  ) {
    this.io
      .to(`workspace:${workspaceId}`)
      .to(`user:${appUserId}`)
      .emit("workspace:updated", workspaceId, workspaceTitle, clientRequestId);
  }

  emitDeleteWorkspace(
    appUserId: string,
    workspaceId: string,
    clientRequestId: string,
  ) {
    this.io
      .to(`workspace:${workspaceId}`)
      .to(`user:${appUserId}`)
      .emit("workspace:deleted", workspaceId, clientRequestId);
  }
}
