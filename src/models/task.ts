// Full task entry stored in the database.
export type TaskEntity = {
  id: number;
  workspaceColumnId: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  deadline: Date | null;
  taskOrder: number;
  createdAt: Date;
};

// Task data returned in responses.
export type TaskResponse = Pick<
  TaskEntity,
  | "id"
  | "workspaceColumnId"
  | "title"
  | "description"
  | "priority"
  | "deadline"
  | "taskOrder"
  | "createdAt"
>;
