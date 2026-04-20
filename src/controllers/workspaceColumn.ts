import { FastifyReply, FastifyRequest } from "fastify";
import { WorkspaceColumnService } from "@services/workspaceColumn.js";

export interface WorkspaceColumnController {
  getWorkspaceColumns(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
}

export class DefaultWorkspaceColumnController
  implements WorkspaceColumnController
{
  constructor(
    private readonly workspaceColumnService: WorkspaceColumnService,
  ) {}

  async getWorkspaceColumns(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ) {
    const columns = await this.workspaceColumnService.getWorkspaceColumns(
      request.user.id,
      request.params.workspaceId,
    );

    reply.code(200).send(columns);
  }
}
