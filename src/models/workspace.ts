import { AppUserEntity } from "@models/appUser.js";

// Full workspace entry used by the application.
export type WorkspaceEntity = {
  id: string;
  title: string;
};

// Incoming payload for workspace creation.
export type WorkspaceCreation = Pick<WorkspaceEntity, "title">;

// Workspace data returned in responses.
export type WorkspaceResponse = Pick<WorkspaceEntity, "id" | "title"> & {
  role: "admin" | "member";
};

export type WorkspaceMemberResponse = Pick<
  AppUserEntity,
  "id" | "firstName" | "lastName" | "email"
> & {
  role: "admin" | "member";
};
