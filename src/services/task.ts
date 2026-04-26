import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@errors/appError.js";
import {
  TaskCreation,
  TaskMoveUpdate,
  TaskOrderUpdate,
  TaskResponse,
  TaskUpdate,
} from "@models/task.js";
import {
  TaskRepository,
  WorkspaceColumnRepository,
  WorkspaceRepository,
} from "@repositories/index.js";

export interface TaskService {
  /**
   * Retrieves the tasks of a workspace. Only users with access to the workspace can perform this action.
   */
  getWorkspaceTasks(
    app_user_id: number,
    workspace_id: string,
  ): Promise<Array<TaskResponse>>;
  /**
   * Creates a task. Only users with access to the workspace can perform this action.
   */
  createTask(
    app_user_id: number,
    workspace_id: string,
    payload: TaskCreation,
  ): Promise<TaskResponse>;
  /**
   * Updates the order of a task within a workspace column. Only users with access to the workspace can perform this action.
   */
  updateTaskOrder(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
    payload: TaskOrderUpdate,
  ): Promise<void>;
  /**
   * Updates a task. Only users with access to the workspace can perform this action.
   */
  updateTask(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
    payload: TaskUpdate,
  ): Promise<void>;
  /**
   * Deletes a task. Only users with access to the workspace can perform this action.
   */
  deleteTask(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
  ): Promise<void>;
  /**
   * Moves a task to a different workspace column. Only users with access to the workspace can perform this action.
   */
  moveTaskToDifferentColumn(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
    payload: TaskMoveUpdate,
  ): Promise<void>;
}

export class DefaultTaskService implements TaskService {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly workspaceColumnRepo: WorkspaceColumnRepository,
    private readonly taskRepo: TaskRepository,
  ) {}

  async getWorkspaceTasks(app_user_id: number, workspace_id: string) {
    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }

    const result = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!result) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    }

    return await this.taskRepo.findWorkspaceTasks(workspace_id);
  }

  async createTask(
    app_user_id: number,
    workspace_id: string,
    payload: TaskCreation,
  ) {
    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }

    const result = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!result) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    }

    const workspaceColumnExists =
      await this.workspaceColumnRepo.checkWorkspaceColumnExistance(
        workspace_id,
        payload.workspaceColumnId,
      );
    if (!workspaceColumnExists) {
      throw new NotFoundError(
        `Workspace column with the given ID does not exist in this workspace.`,
      );
    }

    return await this.taskRepo.createTask(payload);
  }

  async updateTaskOrder(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
    payload: TaskOrderUpdate,
  ) {
    const workspace_column_id = payload.workspaceColumnId.toString();

    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }

    const result = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!result) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    }

    const workspaceColumnExists =
      await this.workspaceColumnRepo.checkWorkspaceColumnExistance(
        workspace_id,
        payload.workspaceColumnId,
      );
    if (!workspaceColumnExists) {
      throw new NotFoundError(
        `Workspace column with the given ID does not exist in this workspace.`,
      );
    }

    const currentTaskOrder = await this.taskRepo.findTaskOrder(
      workspace_column_id,
      task_id,
    );
    if (currentTaskOrder === null) {
      throw new NotFoundError(
        `Task with the given ID does not exist in this workspace column.`,
      );
    }

    const largestTaskOrder =
      await this.taskRepo.findLargestTaskOrder(workspace_column_id);
    const newTaskOrder = payload.taskOrder;
    if (newTaskOrder > (largestTaskOrder ?? 0)) {
      throw new BadRequestError(
        `The new task order ${newTaskOrder} exceeds the largest task order ${largestTaskOrder} in this workspace column.`,
      );
    }
    const taskOrderDifference = newTaskOrder - currentTaskOrder;

    await this.taskRepo.updateTaskOrder(
      workspace_column_id,
      task_id,
      currentTaskOrder,
      newTaskOrder,
      taskOrderDifference,
    );
  }

  async updateTask(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
    payload: TaskUpdate,
  ) {
    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }

    const result = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!result) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    }

    await this.taskRepo.updateTask(workspace_id, task_id, payload);
  }

  async deleteTask(app_user_id: number, workspace_id: string, task_id: string) {
    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }

    const result = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!result) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    }

    await this.taskRepo.deleteTask(workspace_id, task_id);
  }

  async moveTaskToDifferentColumn(
    app_user_id: number,
    workspace_id: string,
    task_id: string,
    payload: TaskMoveUpdate,
  ) {
    if (payload.workspaceColumnId === payload.newWorkspaceColumnId) {
      throw new BadRequestError(
        `The current workspace column ID [${payload.workspaceColumnId}] and the new workspace column ID [${payload.newWorkspaceColumnId}] cannot be the same.`,
      );
    }

    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }

    const result = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!result) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    }

    const currentWorkspaceColumnExists =
      await this.workspaceColumnRepo.checkWorkspaceColumnExistance(
        workspace_id,
        payload.workspaceColumnId,
      );
    if (!currentWorkspaceColumnExists) {
      throw new NotFoundError(
        `Current workspace column with the given ID does not exist in this workspace.`,
      );
    }

    const newWorkspaceColumnExists =
      await this.workspaceColumnRepo.checkWorkspaceColumnExistance(
        workspace_id,
        payload.newWorkspaceColumnId,
      );
    if (!newWorkspaceColumnExists) {
      throw new NotFoundError(
        `New workspace column with the given ID does not exist in this workspace.`,
      );
    }

    const currentTaskOrder = await this.taskRepo.findTaskOrder(
      payload.workspaceColumnId.toString(),
      task_id,
    );
    if (currentTaskOrder === null) {
      throw new NotFoundError(
        `Task with the given ID does not exist in this workspace column.`,
      );
    }

    const largestTaskOrder = await this.taskRepo.findLargestTaskOrder(
      payload.newWorkspaceColumnId.toString(),
    );
    const newTaskOrder = payload.newTaskOrder;
    if (largestTaskOrder === null && newTaskOrder > 0) {
      throw new BadRequestError(
        `The new task order [${newTaskOrder}] cannot be greater than 0 since there are no tasks in the new workspace column.`,
      );
    }
    if (newTaskOrder > (largestTaskOrder ?? 0) + 1) {
      throw new BadRequestError(
        `The new task order [${newTaskOrder}] exceeds the largest task order [${largestTaskOrder}] by more than 1 [newTaskOrder - largestTaskOrder = ${newTaskOrder - (largestTaskOrder ?? 0)}] in this workspace column.`,
      );
    }

    await this.taskRepo.moveTaskToDifferentColumn(
      workspace_id,
      task_id,
      currentTaskOrder,
      payload.workspaceColumnId,
      payload.newTaskOrder,
      payload.newWorkspaceColumnId,
    );
  }
}
