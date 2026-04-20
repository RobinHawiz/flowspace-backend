import { FastifyReply, FastifyRequest } from "fastify";
import { WorkspaceColumnService } from "@services/workspaceColumn.js";
import {
  WorkspaceColumnCreation,
  WorkspaceColumnTitleUpdate,
} from "@models/workspaceColumn.js";

export interface WorkspaceColumnController {
  getWorkspaceColumns(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
  createWorkspaceColumn(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: WorkspaceColumnCreation;
    }>,
    reply: FastifyReply,
  ): Promise<void>;
  deleteWorkspaceColumn(
    request: FastifyRequest<{
      Params: { workspaceId: string; workspaceColumnId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void>;
  updateWorkspaceColumnTitle(
    request: FastifyRequest<{
      Params: { workspaceId: string; workspaceColumnId: string };
      Body: WorkspaceColumnTitleUpdate;
    }>,
    reply: FastifyReply,
  ): Promise<void>;
}

export class DefaultWorkspaceColumnController implements WorkspaceColumnController {
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

  async createWorkspaceColumn(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: WorkspaceColumnCreation;
    }>,
    reply: FastifyReply,
  ) {
    const workspaceColumn =
      await this.workspaceColumnService.createWorkspaceColumn(
        request.user.id,
        request.params.workspaceId,
        request.body,
      );
    reply.code(201).send(workspaceColumn);
  }

  async deleteWorkspaceColumn(
    request: FastifyRequest<{
      Params: { workspaceId: string; workspaceColumnId: string };
    }>,
    reply: FastifyReply,
  ) {
    await this.workspaceColumnService.deleteWorkspaceColumn(
      request.user.id,
      request.params.workspaceId,
      request.params.workspaceColumnId,
    );

    reply.code(204).send();
  }

  async updateWorkspaceColumnTitle(
    request: FastifyRequest<{
      Params: { workspaceId: string; workspaceColumnId: string };
      Body: WorkspaceColumnTitleUpdate;
    }>,
    reply: FastifyReply,
  ) {
    await this.workspaceColumnService.updateWorkspaceColumnTitle(
      request.user.id,
      request.params.workspaceId,
      request.params.workspaceColumnId,
      request.body,
    );

    reply.code(204).send();
  }
}
