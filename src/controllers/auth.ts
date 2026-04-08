import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "@services/auth.js";
import { AppUserCredentials, AppUserRegistration } from "@models/appUser.js";

export interface AuthController {
  loginAppUser(
    request: FastifyRequest<{ Body: AppUserCredentials }>,
    reply: FastifyReply,
  ): Promise<void>;
  getAppUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  insertAppUser(
    request: FastifyRequest<{ Body: AppUserRegistration }>,
    reply: FastifyReply,
  ): Promise<void>;
}

export class DefaultAuthController implements AuthController {
  constructor(private readonly authService: AuthService) {}

  async loginAppUser(
    request: FastifyRequest<{ Body: AppUserCredentials }>,
    reply: FastifyReply,
  ) {
    const token = await this.authService.loginUser(request.body);
    reply.code(200).send(token);
  }

  async getAppUser(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.authService.getAppUser(request.user.id);
    reply.code(200).send(user);
  }

  async insertAppUser(
    request: FastifyRequest<{ Body: AppUserRegistration }>,
    reply: FastifyReply,
  ) {
    const appUser = await this.authService.insertAppUser(request.body);
    reply.code(201).send(appUser);
  }
}
