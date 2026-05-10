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

  emitRemoveMemberWorkspace(
    workspaceId: string,
    removedMemberId: string,
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

  emitRemoveMemberWorkspace(
    workspaceId: string,
    removedMemberId: string,
    callerAppUserId: string,
    clientRequestId: string,
  ) {
    // Notify the removed member about being removed from the workspace.
    this.io
      .to(`user:${removedMemberId}`)
      .emit("workspace:membershipRemoved", workspaceId);

    // Remove the removed member from the workspace room so they no longer receive workspace events.
    this.io
      .in(`user:${removedMemberId}`)
      .socketsLeave(`workspace:${workspaceId}`);

    // Notify existing workspace members about the removed member.
    this.io
      .to(`user:${callerAppUserId}`)
      .to(`workspace:${workspaceId}`)
      .emit(
        "workspace:memberRemoved",
        workspaceId,
        removedMemberId,
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
