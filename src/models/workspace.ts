// Full workspace entry stored in the database.
export type WorkspaceEntity = {
  id: number;
  title: string;
};

// Incoming payload for workspace creation.
export type WorkspaceCreation = Pick<WorkspaceEntity, "title">;

// Workspace data returned in responses.
export type WorkspaceResponse = Pick<WorkspaceEntity, "id" | "title"> & {
  role: "admin" | "member";
};
