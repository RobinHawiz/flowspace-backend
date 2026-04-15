import {
  WorkspaceCreation,
  WorkspaceEntity,
  WorkspaceResponse,
  WorkspaceMemberResponse,
} from "@models/workspace.js";
import { ForbiddenError, NotFoundError } from "@errors/appError.js";
import { AppUserRepository, WorkspaceRepository } from "@repositories/index.js";

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

  /**
   * Updates the title of a workspace. Only users with an admin role in the workspace can perform this action.
   */
  updateWorkspaceTitle(
    app_user_id: number,
    workspace_id: string,
    title: string,
  ): Promise<void>;

  /**
   * Deletes a workspace. Only users with an admin role in the workspace can perform this action.
   */
  deleteWorkspace(app_user_id: number, workspace_id: string): Promise<void>;

  /**
   * Adds a member to a workspace. Only users with an admin role in the workspace can perform this action.
   */
  addWorkspaceMember(
    app_user_id: number,
    workspace_id: string,
    email: string,
  ): Promise<WorkspaceMemberResponse>;
}

export class DefaultWorkspaceService implements WorkspaceService {
  constructor(
    private readonly appUserRepo: AppUserRepository,
    private readonly workspaceRepo: WorkspaceRepository,
  ) {}

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

  async updateWorkspaceTitle(
    app_user_id: number,
    workspace_id: string,
    title: string,
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
    } else if (result.role !== "admin") {
      throw new ForbiddenError(
        `Current app user does not have admin access to this workspace.`,
      );
    }

    return await this.workspaceRepo.updateWorkspaceTitle(workspace_id, title);
  }

  async deleteWorkspace(app_user_id: number, workspace_id: string) {
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
    } else if (result.role !== "admin") {
      throw new ForbiddenError(
        `Current app user does not have admin access to this workspace.`,
      );
    }

    return await this.workspaceRepo.deleteWorkspace(workspace_id);
  }

  async addWorkspaceMember(
    app_user_id: number,
    workspace_id: string,
    email: string,
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
    } else if (result.role !== "admin") {
      throw new ForbiddenError(
        `Current app user does not have admin access to this workspace.`,
      );
    }

    const appUser = await this.appUserRepo.findByEmail(email);
    if (!appUser) {
      throw new NotFoundError(
        `No app user found with the provided email address.`,
      );
    }

    return await this.workspaceRepo.addWorkspaceMember(workspace_id, appUser);
  }
}
