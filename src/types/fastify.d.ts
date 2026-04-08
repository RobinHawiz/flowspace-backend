import { FastifyBaseLogger } from "fastify";
import { Pool } from "pg";
import { AuthRoutes } from "@routes/auth.js";
import { AuthController } from "@controllers/auth.js";
import { AuthService } from "@services/auth.js";
import { AppUserRepository } from "@repositories/appUser.js";
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
  }
}
