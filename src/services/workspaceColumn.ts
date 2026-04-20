import { ForbiddenError, NotFoundError } from "@errors/appError.js";
import {
  WorkspaceColumnCreation,
  WorkspaceColumnResponse,
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
}
