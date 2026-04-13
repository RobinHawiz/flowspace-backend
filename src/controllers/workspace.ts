import { FastifyReply, FastifyRequest } from "fastify";
import { WorkspaceService } from "@services/workspace.js";

export interface WorkspaceController {
  getWorkspaces(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getWorkspace(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
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
}
