import { FastifyInstance } from "fastify";
import authenticateToken from "@hooks/authenticateToken.js";
import { WorkspaceColumnController } from "@controllers/workspaceColumn.js";

export interface WorkspaceColumnRoutes {
  initRoutes(app: FastifyInstance): void;
}

export class DefaultWorkspaceColumnRoutes implements WorkspaceColumnRoutes {
  constructor(
    private readonly workspaceColumnController: WorkspaceColumnController,
  ) {}

  initRoutes(app: FastifyInstance) {
    // Fetches all columns for the current user's workspace.
    app.get<{
      Params: { workspaceId: string };
    }>(
      "/api/workspaces/:workspaceId/workspace-columns",
      {
        onRequest: authenticateToken,
      },
      async (request, reply) => {
        await this.workspaceColumnController.getWorkspaceColumns(
          request,
          reply,
        );
      },
    );
  }
}
