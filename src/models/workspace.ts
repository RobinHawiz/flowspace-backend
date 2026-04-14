// Full workspace entry stored in the database.
export type WorkspaceEntity = {
  id: number;
  title: string;
};

// Incoming payload for workspace creation.
export type WorkspaceCreation = Pick<WorkspaceEntity, "title">;
