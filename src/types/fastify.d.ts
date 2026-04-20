import { FastifyBaseLogger } from "fastify";
import { Pool } from "pg";
import {
  AuthRoutes,
  WorkspaceRoutes,
  WorkspaceColumnRoutes,
} from "@routes/index.js";
import {
  AuthController,
  WorkspaceController,
  WorkspaceColumnController,
} from "@controllers/index.js";
import {
  AuthService,
  WorkspaceService,
  WorkspaceColumnService,
} from "@services/index.js";
import {
  AppUserRepository,
  WorkspaceRepository,
  WorkspaceColumnRepository,
} from "@repositories/index.js";
import { AuthTokenPayload } from "@models/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthTokenPayload;
  }
}

declare module "@fastify/awilix" {
  interface Cradle {
    logger: FastifyBaseLogger;
    pool: Pool;
    authRoutes: AuthRoutes;
    authController: AuthController;
    authService: AuthService;
    appUserRepo: AppUserRepository;
    workspaceRoutes: WorkspaceRoutes;
    workspaceController: WorkspaceController;
    workspaceService: WorkspaceService;
    workspaceRepo: WorkspaceRepository;
    workspaceColumnRoutes: WorkspaceColumnRoutes;
    workspaceColumnController: WorkspaceColumnController;
    workspaceColumnService: WorkspaceColumnService;
    workspaceColumnRepo: WorkspaceColumnRepository;
  }
}
