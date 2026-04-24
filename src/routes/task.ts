import { FastifyInstance } from "fastify";
import authenticateToken from "@hooks/authenticateToken.js";
import { TaskController } from "@controllers/task.js";

export interface TaskRoutes {
  initRoutes(app: FastifyInstance): void;
}

export class DefaultTaskRoutes implements TaskRoutes {
  constructor(private readonly taskController: TaskController) {}

  initRoutes(app: FastifyInstance) {
    // Fetches all tasks for the current user's workspace.
    app.get<{
      Params: { workspaceId: string };
    }>(
      "/api/workspaces/:workspaceId/tasks",
      {
        onRequest: authenticateToken,
      },
      async (request, reply) => {
        await this.taskController.getWorkspaceTasks(request, reply);
      },
    );
  }
}
