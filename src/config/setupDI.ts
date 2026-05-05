import { FastifyBaseLogger } from "fastify";
import { asFunction, asClass, asValue } from "awilix";
import { diContainer } from "@fastify/awilix";
import createPostgreSQLPool from "@config/db.js";
import createWebSocket from "@config/webSocket.js";
import { CorsOptions } from "@config/cors.js";
import { Server } from "http";
import DefaultPublisher from "@realtime/publisher.js";
import {
  DefaultAuthRoutes,
  DefaultWorkspaceRoutes,
  DefaultWorkspaceColumnRoutes,
  DefaultTaskRoutes,
} from "@routes/index.js";
import {
  DefaultAuthController,
  DefaultWorkspaceController,
  DefaultWorkspaceColumnController,
  DefaultTaskController,
} from "@controllers/index.js";
import {
  DefaultAuthService,
  DefaultWorkspaceService,
  DefaultWorkspaceColumnService,
  DefaultTaskService,
} from "@services/index.js";
import {
  PostgreSQLAppUserRepository,
  PostgreSQLWorkspaceRepository,
  PostgreSQLWorkspaceColumnRepository,
  PostgreSQLTaskRepository,
} from "@repositories/index.js";

export default function setupDI(
  logger: FastifyBaseLogger,
  server: Server,
  cors: CorsOptions,
) {
  diContainer.register({
    logger: asValue(logger),
    pool: asFunction(createPostgreSQLPool)
      .singleton()
      .disposer((pool) => pool.end()),
    io: asFunction(() => createWebSocket(server, cors))
      .singleton()
      .disposer((io) => io.close()),
    publisher: asClass(DefaultPublisher).classic().singleton(),
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
    taskRoutes: asClass(DefaultTaskRoutes).classic().singleton(),
    taskController: asClass(DefaultTaskController).classic().singleton(),
    taskService: asClass(DefaultTaskService).classic().singleton(),
    taskRepo: asClass(PostgreSQLTaskRepository).classic().singleton(),
  });
}
