import { FastifyInstance } from "fastify";
import authenticateToken from "@hooks/authenticateToken.js";
import { WorkspaceController } from "@controllers/workspace.js";

export interface WorkspaceRoutes {
  initRoutes(app: FastifyInstance): void;
}

export class DefaultWorkspaceRoutes implements WorkspaceRoutes {
  constructor(private readonly workspaceController: WorkspaceController) {}

  initRoutes(app: FastifyInstance) {
    // Fetches all workspaces for the current user.
    app.get(
      "/api/workspaces",
      {
        onRequest: authenticateToken,
      },
      async (request, reply) => {
        await this.workspaceController.getWorkspaces(request, reply);
      },
    );
  }
}
