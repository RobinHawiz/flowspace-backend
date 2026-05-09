import {
  WorkspaceCreation,
  WorkspaceResponse,
  WorkspaceMemberResponse,
} from "@models/workspace.js";
import { ForbiddenError, NotFoundError } from "@errors/appError.js";
import { AppUserRepository, WorkspaceRepository } from "@repositories/index.js";

export interface WorkspaceService {
  /**
   * Retrieves the workspaces for the current app user.
   */
  getWorkspaces(app_user_id: string): Promise<Array<WorkspaceResponse>>;
  /**
   * Retrieves a specific workspace for the current app user.
   */
  getWorkspace(
    app_user_id: string,
    workspace_id: string,
  ): Promise<WorkspaceResponse>;

  /**
   * Creates a workspace and assigns the current app user to it with an admin role.
   */
  createWorkspace(
    app_user_id: string,
    payload: WorkspaceCreation,
  ): Promise<WorkspaceResponse>;

  /**
   * Updates the title of a workspace. Only users with an admin role in the workspace can perform this action.
   */
  updateWorkspaceTitle(
    app_user_id: string,
    workspace_id: string,
    title: string,
  ): Promise<void>;

  /**
   * Deletes a workspace. Only users with an admin role in the workspace can perform this action.
   */
  deleteWorkspace(app_user_id: string, workspace_id: string): Promise<void>;

  /**
   * Retrieves the members of a workspace. Only users with access to the workspace can perform this action.
   */
  getWorkspaceMembers(
    app_user_id: string,
    workspace_id: string,
  ): Promise<Array<WorkspaceMemberResponse>>;

  /**
   * Adds a member to a workspace. Only users with an admin role in the workspace can perform this action.
   */
  addWorkspaceMember(
    app_user_id: string,
    workspace_id: string,
    email: string,
  ): Promise<{
    addedMember: WorkspaceMemberResponse;
    addedMemberWorkspaceResponse: WorkspaceResponse;
  }>;
  /**
   * Removes a member from a workspace. Only users with an admin role in the workspace can perform this action.
   */
  removeWorkspaceMember(
    app_user_id: string,
    workspace_id: string,
    member_id: string,
  ): Promise<void>;
}

export class DefaultWorkspaceService implements WorkspaceService {
  constructor(
    private readonly appUserRepo: AppUserRepository,
    private readonly workspaceRepo: WorkspaceRepository,
  ) {}

  async getWorkspaces(app_user_id: string) {
    return await this.workspaceRepo.findWorkspaces(app_user_id);
  }

  async getWorkspace(app_user_id: string, workspace_id: string) {
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

  async createWorkspace(app_user_id: string, payload: WorkspaceCreation) {
    return await this.workspaceRepo.createWorkspace(app_user_id, payload);
  }

  async getWorkspaceMembers(app_user_id: string, workspace_id: string) {
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

    return await this.workspaceRepo.getWorkspaceMembers(workspace_id);
  }

  async updateWorkspaceTitle(
    app_user_id: string,
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

  async deleteWorkspace(app_user_id: string, workspace_id: string) {
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
    app_user_id: string,
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

    const addedMember = await this.workspaceRepo.addWorkspaceMember(
      workspace_id,
      appUser,
    );

    const addedMemberWorkspaceResponse: WorkspaceResponse = {
      ...result,
      role: addedMember.role,
    };

    return { addedMember, addedMemberWorkspaceResponse };
  }

  async removeWorkspaceMember(
    app_user_id: string,
    workspace_id: string,
    member_id: string,
  ) {
    const isRemovingSelf = app_user_id === member_id;
    const workspaceExists =
      await this.workspaceRepo.checkWorkspaceExistance(workspace_id);
    if (!workspaceExists) {
      throw new NotFoundError(`Workspace with the given ID does not exist.`);
    }
    const resultAppUser = await this.workspaceRepo.findCurrentAppUserWorkspace(
      app_user_id,
      workspace_id,
    );
    if (!resultAppUser) {
      throw new ForbiddenError(
        `Current app user does not have access to this workspace.`,
      );
    } else if (resultAppUser.role === "member" && isRemovingSelf) {
      return await this.workspaceRepo.removeWorkspaceMember(
        workspace_id,
        member_id,
      );
    } else if (resultAppUser.role !== "admin") {
      throw new ForbiddenError(
        `Current app user does not have admin access to this workspace.`,
      );
    } else if (resultAppUser.role === "admin" && isRemovingSelf) {
      throw new ForbiddenError(
        `Admin users cannot remove themselves from the workspace.`,
      );
    }

    const resultMember = await this.workspaceRepo.findCurrentAppUserWorkspace(
      member_id,
      workspace_id,
    );
    if (!resultMember) {
      throw new NotFoundError(
        `The member to be removed does not exist in this workspace.`,
      );
    }

    return await this.workspaceRepo.removeWorkspaceMember(
      workspace_id,
      member_id,
    );
  }
}
