import { AppError } from "@errors/appError.js";
import {
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from "@models/workspace.js";

export interface ServerToClientEvents {
  "workspace:created": (
    workspace: WorkspaceResponse,
    clientRequestId: string,
  ) => void;
  "workspace:updated": (
    workspaceId: string,
    workspaceTitle: string,
    clientRequestId: string,
  ) => void;
  "workspace:deleted": (workspaceId: string, clientRequestId: string) => void;
  "workspace:membershipAdded": (workspace: WorkspaceResponse) => void;
  "workspace:memberAdded": (
    workspaceId: string,
    addedMember: WorkspaceMemberResponse,
    clientRequestId: string,
  ) => void;
  "workspace:membershipRemoved": (workspaceId: string) => void;
  "workspace:memberRemoved": (
    workspaceId: string,
    removedMemberId: string,
    clientRequestId: string,
  ) => void;
  "workspace:join_error": (error: AppError) => void;
}

export interface ClientToServerEvents {
  "workspace:join": (workspaceId: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
}
