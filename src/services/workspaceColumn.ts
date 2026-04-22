import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@errors/appError.js";
import {
  WorkspaceColumnCreation,
  WorkspaceColumnOrderUpdate,
  WorkspaceColumnResponse,
  WorkspaceColumnTitleUpdate,
} from "@models/workspaceColumn.js";
import {
  WorkspaceColumnRepository,
  WorkspaceRepository,
} from "@repositories/index.js";

export interface WorkspaceColumnService {
  /**
   * Retrieves the columns of a workspace. Only users with access to the workspace can perform this action.
   */
  getWorkspaceColumns(
    app_user_id: number,
    workspace_id: string,
  ): Promise<Array<WorkspaceColumnResponse>>;
  /**
   * Creates a workspace column. Only users with access to the workspace can perform this action.
   */
  createWorkspaceColumn(
    app_user_id: number,
    workspace_id: string,
    payload: WorkspaceColumnCreation,
  ): Promise<WorkspaceColumnResponse>;
  /**
   * Updates the title of a workspace column. Only users with access to the workspace can perform this action.
   */
  updateWorkspaceColumnTitle(
    app_user_id: number,
    workspace_id: string,
    workspace_column_id: string,
    payload: WorkspaceColumnTitleUpdate,
  ): Promise<void>;
  /**
   * Updates the order of a workspace column. Only users with access to the workspace can perform this action.
   */
  updateWorkspaceColumnOrder(
    app_user_id: number,
    workspace_id: string,
    workspace_column_id: string,
    payload: WorkspaceColumnOrderUpdate,
  ): Promise<void>;
  /**
   * Deletes a workspace column. Only users with access to the workspace can perform this action.
   */
  deleteWorkspaceColumn(
    app_user_id: number,
    workspace_id: string,
    workspace_column_id: string,
  ): Promise<void>;
}

export class DefaultWorkspaceColumnService implements WorkspaceColumnService {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly workspaceColumnRepo: WorkspaceColumnRepository,
  ) {}

  async getWorkspaceColumns(app_user_id: number, workspace_id: string) {
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

    return await this.workspaceColumnRepo.findWorkspaceColumns(workspace_id);
  }

  async createWorkspaceColumn(
    app_user_id: number,
    workspace_id: string,
    payload: WorkspaceColumnCreation,
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

    return await this.workspaceColumnRepo.createWorkspaceColumn(
      workspace_id,
      payload,
    );
  }

  async deleteWorkspaceColumn(
    app_user_id: number,
    workspace_id: string,
    workspace_column_id: string,
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

    const isDeleted = await this.workspaceColumnRepo.deleteWorkspaceColumn(
      workspace_id,
      workspace_column_id,
    );
    if (!isDeleted) {
      throw new NotFoundError(
        `Workspace column with the given ID does not exist in this workspace.`,
      );
    }
  }

  async updateWorkspaceColumnTitle(
    app_user_id: number,
    workspace_id: string,
    workspace_column_id: string,
    payload: WorkspaceColumnTitleUpdate,
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

    const isUpdated = await this.workspaceColumnRepo.updateWorkspaceColumnTitle(
      workspace_id,
      workspace_column_id,
      payload,
    );
    if (!isUpdated) {
      throw new NotFoundError(
        `Workspace column with the given ID does not exist in this workspace.`,
      );
    }
  }

  async updateWorkspaceColumnOrder(
    app_user_id: number,
    workspace_id: string,
    workspace_column_id: string,
    payload: WorkspaceColumnOrderUpdate,
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

    const currentColumnOrder =
      await this.workspaceColumnRepo.findWorkspaceColumnOrder(
        workspace_id,
        workspace_column_id,
      );
    if (currentColumnOrder === null) {
      throw new NotFoundError(
        `Workspace column with the given ID does not exist in this workspace.`,
      );
    }

    const largestColumnOrder =
      await this.workspaceColumnRepo.findLargestWorkspaceColumnOrder(
        workspace_id,
      );
    const newColumnOrder = payload.workspaceColumnOrder;
    if (newColumnOrder > largestColumnOrder) {
      throw new BadRequestError(
        `The new column order ${newColumnOrder} exceeds the largest column order ${largestColumnOrder} in this workspace.`,
      );
    }
    const columnOrderDifference = newColumnOrder - currentColumnOrder;

    await this.workspaceColumnRepo.updateWorkspaceColumnOrder(
      workspace_id,
      workspace_column_id,
      currentColumnOrder,
      newColumnOrder,
      columnOrderDifference,
    );
  }
}
