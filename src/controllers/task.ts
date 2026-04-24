import { FastifyReply, FastifyRequest } from "fastify";
import { TaskService } from "@services/task.js";

export interface TaskController {
  getWorkspaceTasks(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
}

export class DefaultTaskController implements TaskController {
  constructor(private readonly taskService: TaskService) {}

  async getWorkspaceTasks(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ) {
    const tasks = await this.taskService.getWorkspaceTasks(
      request.user.id,
      request.params.workspaceId,
    );

    reply.code(200).send(tasks);
  }
}
