import { AppError } from "@errors/appError.js";
import { WorkspaceResponse } from "@models/workspace.js";

export interface ServerToClientEvents {
  "workspace:created": (
    workspace: WorkspaceResponse,
    clientRequestId: string,
  ) => void;
  "workspace:updated": (
    workspaceId: number,
    workspaceTitle: string,
    clientRequestId: string,
  ) => void;
  "workspace:deleted": (workspaceId: number, clientRequestId: string) => void;
  "workspace:join_error": (error: AppError) => void;
}

export interface ClientToServerEvents {
  "workspace:join": (workspaceId: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: number;
}
