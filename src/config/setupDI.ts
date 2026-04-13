import { FastifyBaseLogger } from "fastify";
import { asFunction, asClass, asValue } from "awilix";
import { diContainer } from "@fastify/awilix";
import createPostgreSQLPool from "@config/db.js";
import { DefaultAuthRoutes, DefaultWorkspaceRoutes } from "@routes/index.js";
import {
  DefaultAuthController,
  DefaultWorkspaceController,
} from "@controllers/index.js";
import {
  DefaultAuthService,
  DefaultWorkspaceService,
} from "@services/index.js";
import {
  PostgreSQLAppUserRepository,
  PostgreSQLWorkspaceRepository,
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
  });
}
