import { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "@services/auth.js";
import { AppUserCredentials, AppUserRegistration } from "@models/appUser.js";
import DefaultPublisher from "@realtime/publisher.js";

export interface AuthController {
  loginAppUser(
    request: FastifyRequest<{ Body: AppUserCredentials }>,
    reply: FastifyReply,
  ): Promise<void>;
  logoutAppUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getAppUser(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  insertAppUser(
    request: FastifyRequest<{ Body: AppUserRegistration }>,
    reply: FastifyReply,
  ): Promise<void>;
}

export class DefaultAuthController implements AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly publisher: DefaultPublisher,
  ) {}

  async loginAppUser(
    request: FastifyRequest<{ Body: AppUserCredentials }>,
    reply: FastifyReply,
  ) {
    const token = await this.authService.loginUser(request.body);
    reply.setCookie("token", token);
    reply.code(200).send({ success: true });
  }

  async logoutAppUser(
    request: FastifyRequest<{ Headers: { "x-client-request-id": string } }>,
    reply: FastifyReply,
  ) {
    reply.clearCookie("token");
    reply.code(200).send({ success: true });

    const clientRequestId = request.headers["x-client-request-id"];
    if (clientRequestId) {
      this.publisher.emitLogOut(request.user.id, clientRequestId);
    }
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
