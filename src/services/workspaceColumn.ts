import { ForbiddenError, NotFoundError } from "@errors/appError.js";
import { WorkspaceColumnResponse } from "@models/workspaceColumn.js";
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
}
