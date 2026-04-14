import { WorkspaceRepository } from "@repositories/workspace.js";
import {
  WorkspaceCreation,
  WorkspaceEntity,
  WorkspaceResponse,
} from "@models/workspace.js";
import { ForbiddenError, NotFoundError } from "@errors/appError.js";

export interface WorkspaceService {
  /**
   * Retrieves the workspaces for the current app user.
   */
  getWorkspaces(app_user_id: number): Promise<Array<WorkspaceResponse>>;
  /**
   * Retrieves a specific workspace for the current app user.
   */
  getWorkspace(
    app_user_id: number,
    workspace_id: string,
  ): Promise<WorkspaceResponse>;

  /**
   * Creates a workspace and assigns the current app user to it with an admin role.
   */
  createWorkspace(
    app_user_id: number,
    payload: WorkspaceCreation,
  ): Promise<WorkspaceEntity>;
}

export class DefaultWorkspaceService implements WorkspaceService {
  constructor(private readonly workspaceRepo: WorkspaceRepository) {}

  async getWorkspaces(app_user_id: number) {
    return await this.workspaceRepo.findWorkspaces(app_user_id);
  }

  async getWorkspace(app_user_id: number, workspace_id: string) {
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
    return result;
  }

  async createWorkspace(app_user_id: number, payload: WorkspaceCreation) {
    return await this.workspaceRepo.createWorkspace(app_user_id, payload);
  }
}
