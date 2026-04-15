import { FastifyReply, FastifyRequest } from "fastify";
import { WorkspaceService } from "@services/workspace.js";
import { WorkspaceCreation } from "@models/workspace.js";

export interface WorkspaceController {
  getWorkspaces(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getWorkspace(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
  createWorkspace(
    request: FastifyRequest<{ Body: WorkspaceCreation }>,
    reply: FastifyReply,
  ): Promise<void>;
  updateWorkspaceTitle(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: { title: string };
    }>,
    reply: FastifyReply,
  ): Promise<void>;
  deleteWorkspace(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
  addWorkspaceMember(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: { email: string };
    }>,
    reply: FastifyReply,
  ): Promise<void>;
}

export class DefaultWorkspaceController implements WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async getWorkspaces(request: FastifyRequest, reply: FastifyReply) {
    const workspaces = await this.workspaceService.getWorkspaces(
      request.user.id,
    );
    reply.code(200).send(workspaces);
  }

  async getWorkspace(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ) {
    const workspace = await this.workspaceService.getWorkspace(
      request.user.id,
      request.params.workspaceId,
    );
    reply.code(200).send(workspace);
  }

  async createWorkspace(
    request: FastifyRequest<{ Body: WorkspaceCreation }>,
    reply: FastifyReply,
  ) {
    const workspace = await this.workspaceService.createWorkspace(
      request.user.id,
      request.body,
    );
    reply.code(201).send(workspace);
  }

  async updateWorkspaceTitle(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: { title: string };
    }>,
    reply: FastifyReply,
  ) {
    await this.workspaceService.updateWorkspaceTitle(
      request.user.id,
      request.params.workspaceId,
      request.body.title,
    );

    reply.code(204).send();
  }

  async deleteWorkspace(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ) {
    await this.workspaceService.deleteWorkspace(
      request.user.id,
      request.params.workspaceId,
    );

    reply.code(204).send();
  }

  async addWorkspaceMember(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: { email: string };
    }>,
    reply: FastifyReply,
  ) {
    const appUser = await this.workspaceService.addWorkspaceMember(
      request.user.id,
      request.params.workspaceId,
      request.body.email,
    );

    reply.code(201).send(appUser);
  }
}
