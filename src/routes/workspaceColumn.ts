import { FastifyInstance } from "fastify";
import authenticateToken from "@hooks/authenticateToken.js";
import { WorkspaceColumnController } from "@controllers/workspaceColumn.js";
import {
  WorkspaceColumnCreation,
  WorkspaceColumnTitleUpdate,
} from "@models/workspaceColumn.js";
import {
  workspaceColumnCreationSchema,
  workspaceColumnTitleUpdateSchema,
} from "@schemas/workspaceColumn.js";

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

    // Creates a workspace column after validating the request body.
    app.post<{
      Params: { workspaceId: string };
      Body: WorkspaceColumnCreation;
    }>(
      "/api/workspaces/:workspaceId/workspace-columns",
      {
        onRequest: authenticateToken,
        schema: {
          body: workspaceColumnCreationSchema,
        },
      },
      async (request, reply) => {
        await this.workspaceColumnController.createWorkspaceColumn(
          request,
          reply,
        );
      },
    );

    // Delete workspace column.
    app.delete<{
      Params: { workspaceId: string; workspaceColumnId: string };
    }>(
      "/api/workspaces/:workspaceId/workspace-columns/:workspaceColumnId",
      {
        onRequest: authenticateToken,
      },
      async (request, reply) => {
        await this.workspaceColumnController.deleteWorkspaceColumn(
          request,
          reply,
        );
      },
    );

    // Update workspace column title.
    app.patch<{
      Params: { workspaceId: string; workspaceColumnId: string };
      Body: WorkspaceColumnTitleUpdate;
    }>(
      "/api/workspaces/:workspaceId/workspace-columns/:workspaceColumnId/title",
      {
        onRequest: authenticateToken,
        schema: {
          body: workspaceColumnTitleUpdateSchema,
        },
      },
      async (request, reply) => {
        await this.workspaceColumnController.updateWorkspaceColumnTitle(
          request,
          reply,
        );
      },
    );
  }
}
