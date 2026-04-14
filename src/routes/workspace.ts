import { FastifyInstance } from "fastify";
import authenticateToken from "@hooks/authenticateToken.js";
import { WorkspaceController } from "@controllers/workspace.js";
import { WorkspaceCreation } from "@models/workspace.js";
import { workspaceCreationSchema } from "@schemas/workspace.js";

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

    // Fetches the current user's workspace.
    app.get<{
      Params: { workspaceId: string };
    }>(
      "/api/workspaces/:workspaceId",
      {
        onRequest: authenticateToken,
      },
      async (request, reply) => {
        await this.workspaceController.getWorkspace(request, reply);
      },
    );

    // Creates a workspace after validating the request body.
    app.post<{ Body: WorkspaceCreation }>(
      "/api/workspaces",
      {
        onRequest: authenticateToken,
        schema: {
          body: workspaceCreationSchema,
        },
      },
      async (request, reply) => {
        await this.workspaceController.createWorkspace(request, reply);
      },
    );
  }
}
