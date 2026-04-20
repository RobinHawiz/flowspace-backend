// Full workspace column entry stored in the database.
export type WorkspaceColumnEntity = {
  id: number;
  workspaceId: number;
  title: string;
  workspaceColumnOrder: number;
};

// Workspace column data returned in responses.
export type WorkspaceColumnResponse = Pick<
  WorkspaceColumnEntity,
  "id" | "title" | "workspaceColumnOrder"
>;
