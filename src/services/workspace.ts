import { WorkspaceRepository } from "@repositories/workspace.js";
import { WorkspaceEntity } from "@models/workspace.js";

export interface WorkspaceService {
  /**
   * Retrieves the workspaces for the current app user.
   */
  getWorkspaces(app_user_id: number): Promise<Array<WorkspaceEntity>>;
}

export class DefaultWorkspaceService implements WorkspaceService {
  constructor(private readonly workspaceRepo: WorkspaceRepository) {}

  async getWorkspaces(app_user_id: number) {
    return await this.workspaceRepo.findWorkspaces(app_user_id);
  }
}
