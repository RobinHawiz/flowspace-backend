import { FastifyReply, FastifyRequest } from "fastify";
import { TaskService } from "@services/task.js";
import { TaskCreation, TaskOrderUpdate } from "@models/task.js";

export interface TaskController {
  getWorkspaceTasks(
    request: FastifyRequest<{ Params: { workspaceId: string } }>,
    reply: FastifyReply,
  ): Promise<void>;
  createTask(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: TaskCreation;
    }>,
    reply: FastifyReply,
  ): Promise<void>;
  updateTaskOrder(
    request: FastifyRequest<{
      Params: {
        workspaceId: string;
        taskId: string;
      };
      Body: TaskOrderUpdate;
    }>,
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

  async createTask(
    request: FastifyRequest<{
      Params: { workspaceId: string };
      Body: TaskCreation;
    }>,
    reply: FastifyReply,
  ) {
    const task = await this.taskService.createTask(
      request.user.id,
      request.params.workspaceId,
      request.body,
    );

    reply.code(201).send(task);
  }

  async updateTaskOrder(
    request: FastifyRequest<{
      Params: {
        workspaceId: string;
        workspaceColumnId: string;
        taskId: string;
      };
      Body: TaskOrderUpdate;
    }>,
    reply: FastifyReply,
  ) {
    await this.taskService.updateTaskOrder(
      request.user.id,
      request.params.workspaceId,
      request.params.taskId,
      request.body,
    );

    reply.code(204).send();
  }
}
