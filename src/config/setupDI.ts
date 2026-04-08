import { FastifyBaseLogger } from "fastify";
import { asFunction, asClass, asValue } from "awilix";
import { diContainer } from "@fastify/awilix";
import createPostgreSQLPool from "@config/db.js";
import { DefaultAuthController } from "@/controllers/auth.js";
import { DefaultAuthService } from "@services/auth.js";
import { PostgreSQLAppUserRepository } from "@repositories/appUser.js";
import { DefaultAuthRoutes } from "@routes/auth.js";

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
  });
}
