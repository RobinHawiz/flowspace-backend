import { FastifyBaseLogger } from "fastify";
import { asFunction, asClass, asValue } from "awilix";
import { diContainer } from "@fastify/awilix";
import createPostgreSQLPool from "@config/db.js";
import {
  DefaultAuthRoutes,
  DefaultWorkspaceRoutes,
  DefaultWorkspaceColumnRoutes,
} from "@routes/index.js";
import {
  DefaultAuthController,
  DefaultWorkspaceController,
  DefaultWorkspaceColumnController,
} from "@controllers/index.js";
import {
  DefaultAuthService,
  DefaultWorkspaceService,
  DefaultWorkspaceColumnService,
} from "@services/index.js";
import {
  PostgreSQLAppUserRepository,
  PostgreSQLWorkspaceRepository,
  PostgreSQLWorkspaceColumnRepository,
} from "@repositories/index.js";

export default function setupDI(logger: FastifyBaseLogger) {
  diContainer.register({
    logger: asValue(logger),
    pool: asFunction(createPostgreSQLPool)
      .singleton()
      .disposer((pool) => pool.end()),
    authRoutes: asClass(DefaultAuthRoutes).classic().singleton(),
    authController: asClass(DefaultAuthController).classic().singleton(),
    authService: asClass(DefaultAuthService).classic().singleton(),
    appUserRepo: asClass(PostgreSQLAppUserRepository).classic().singleton(),
    workspaceRoutes: asClass(DefaultWorkspaceRoutes).classic().singleton(),
    workspaceController: asClass(DefaultWorkspaceController)
      .classic()
      .singleton(),
    workspaceService: asClass(DefaultWorkspaceService).classic().singleton(),
    workspaceRepo: asClass(PostgreSQLWorkspaceRepository).classic().singleton(),
    workspaceColumnRoutes: asClass(DefaultWorkspaceColumnRoutes)
      .classic()
      .singleton(),
    workspaceColumnController: asClass(DefaultWorkspaceColumnController)
      .classic()
      .singleton(),
    workspaceColumnService: asClass(DefaultWorkspaceColumnService)
      .classic()
      .singleton(),
    workspaceColumnRepo: asClass(PostgreSQLWorkspaceColumnRepository)
      .classic()
      .singleton(),
  });
}
