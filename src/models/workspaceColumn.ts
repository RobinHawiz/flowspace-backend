// Full workspace column entry used by the application.
export type WorkspaceColumnEntity = {
  id: string;
  workspaceId: string;
  title: string;
  workspaceColumnOrder: number;
};

// Workspace column data returned in responses.
export type WorkspaceColumnResponse = Pick<
  WorkspaceColumnEntity,
  "id" | "title" | "workspaceColumnOrder"
>;

export type WorkspaceColumnCreation = Pick<
  WorkspaceColumnEntity,
  "title" | "workspaceColumnOrder"
>;

export type WorkspaceColumnTitleUpdate = Pick<WorkspaceColumnEntity, "title">;

export type WorkspaceColumnOrderUpdate = Pick<
  WorkspaceColumnEntity,
  "workspaceColumnOrder"
>;
