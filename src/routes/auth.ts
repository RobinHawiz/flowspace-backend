import { FastifyInstance } from "fastify";
import { AuthController } from "@controllers/auth.js";
import {
  appUserCredentialsSchema,
  appUserRegistrationSchema,
} from "@schemas/appUser.js";
import { AppUserCredentials, AppUserRegistration } from "@models/appUser.js";
import authenticateToken from "@hooks/authenticateToken.js";

export interface AuthRoutes {
  initRoutes(app: FastifyInstance): void;
}

export class DefaultAuthRoutes implements AuthRoutes {
  constructor(private readonly authController: AuthController) {}

  initRoutes(app: FastifyInstance) {
    // Fetches the current app user after validating the JWT.
    app.get(
      "/api/auth/me",
      {
        onRequest: authenticateToken,
      },
      async (request, reply) => {
        await this.authController.getAppUser(request, reply);
      },
    );

    // Authenticates an app user and returns a JWT if successful.
    app.post<{ Body: AppUserCredentials }>(
      "/api/auth/login",
      {
        schema: {
          body: appUserCredentialsSchema,
        },
      },
      async (request, reply) => {
        await this.authController.loginAppUser(request, reply);
      },
    );

    // Creates an app user after validating the request body.
    app.post<{ Body: AppUserRegistration }>(
      "/api/auth/register",
      {
        schema: {
          body: appUserRegistrationSchema,
        },
      },
      async (request, reply) => {
        await this.authController.insertAppUser(request, reply);
      },
    );
  }
}
