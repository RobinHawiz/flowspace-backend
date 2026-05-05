import { FastifyBaseLogger } from "fastify";
import { Pool } from "pg";
import {
  AuthRoutes,
  WorkspaceRoutes,
  WorkspaceColumnRoutes,
  TaskRoutes,
} from "@routes/index.js";
import {
  AuthController,
  WorkspaceController,
  WorkspaceColumnController,
  TaskController,
} from "@controllers/index.js";
import {
  AuthService,
  WorkspaceService,
  WorkspaceColumnService,
  TaskService,
} from "@services/index.js";
import {
  AppUserRepository,
  WorkspaceRepository,
  WorkspaceColumnRepository,
  TaskRepository,
} from "@repositories/index.js";
import { AuthTokenPayload } from "@models/auth.js";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@customTypes/socket.io.js";
import { Server } from "socket.io";
import { Publisher } from "@src/realtime/publisher.js";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthTokenPayload;
  }
}

declare module "@fastify/awilix" {
  interface Cradle {
    logger: FastifyBaseLogger;
    pool: Pool;
    io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >;
    publisher: Publisher;
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
    taskRoutes: TaskRoutes;
    taskController: TaskController;
    taskService: TaskService;
    taskRepo: TaskRepository;
  }
}
