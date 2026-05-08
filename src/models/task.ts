// Full task entry used by the application.
export type TaskEntity = {
  id: string;
  workspaceColumnId: string;
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

// Incoming payload for task creation.
export type TaskCreation = Pick<
  TaskEntity,
  "workspaceColumnId" | "title" | "priority" | "taskOrder"
> & {
  description?: string | null;
  deadline?: string | null;
};

// Incoming payload for task order update.
export type TaskOrderUpdate = Pick<
  TaskEntity,
  "workspaceColumnId" | "taskOrder"
>;

// Incoming payload for task updates.
export type TaskUpdate = Pick<TaskEntity, "title" | "priority"> & {
  description?: string | null;
  deadline?: string | null;
};

export type TaskMoveUpdate = Pick<TaskEntity, "workspaceColumnId"> & {
  newWorkspaceColumnId: string;
  newTaskOrder: number;
};
