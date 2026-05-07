import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { FastifyBaseLogger } from "fastify";
import { WorkspaceRepository } from "@repositories/workspace.js";
import { ExtendedError, Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@customTypes/socket.io.js";
import { isAuthTokenPayload } from "@hooks/authenticateToken.js";
import {
  AppError,
  ForbiddenError,
  InternalServerError,
  UnauthorizedError,
} from "@errors/appError.js";

export interface Subscriber {}

export default class DefaultSubscriber implements Subscriber {
  constructor(
    private readonly io: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    private readonly logger: FastifyBaseLogger,
    private readonly workspaceRepo: WorkspaceRepository,
  ) {
    this.io.use((socket, next) => this.handlePreConnection(socket, next));
    this.io.on("connection", (socket) => this.handleConnection(socket));
  }

  // Authenticate the socket and add it to user rooms before connection handlers run.
  private handlePreConnection(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    next: (err?: ExtendedError) => void,
  ) {
    const cookies = parse(socket.handshake.headers.cookie || "");
    const token = cookies["token"];

    if (!token) {
      const unauthorizedError = new UnauthorizedError("Missing auth token.");
      next(unauthorizedError);
      this.logger.warn(unauthorizedError);
      return;
    }

    try {
      const userId = this.authenticateToken(token);
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      this.logger.debug(`socket joined user room user:${userId}`);

      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        this.logger.warn(err);
      }
    }
  }

  private handleConnection(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    socket.on("disconnect", () => this.handleDisconnection(socket));
    socket.on(
      "workspace:join",
      async (workspaceId: string) =>
        await this.handleWorkspaceJoin(socket, workspaceId),
    );
  }

  private handleDisconnection(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    this.logger.debug(`socket disconnected from user:${socket.data.userId}`);
  }

  private async handleWorkspaceJoin(
    socket: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    workspaceId: string,
  ) {
    try {
      const workspace = await this.workspaceRepo.findCurrentAppUserWorkspace(
        socket.data.userId,
        workspaceId,
      );

      if (!workspace) {
        socket.emit(
          "workspace:join_error",
          new ForbiddenError(
            "Current app user does not have access to this workspace.",
          ),
        );
        this.logger.warn(
          `Unauthorized workspace join attempt by app user with ID ${socket.data.userId} for workspace ID: ${workspaceId}`,
        );
        return;
      }

      socket.join(`workspace:${workspaceId}`);
      this.logger.debug(
        `socket joined workspace room workspace:${workspaceId}`,
      );
    } catch (err) {
      if (err instanceof AppError) {
        socket.emit("workspace:join_error", err);
        this.logger.warn(err);
      } else {
        const unexpectedError = new InternalServerError(
          "An unexpected error occurred while joining the workspace.",
        );
        socket.emit("workspace:join_error", unexpectedError);
        this.logger.error(unexpectedError);
      }
    }
  }

  private authenticateToken(token: string) {
    try {
      const key = process.env.JWT_SECRET_KEY!;
      const decoded = jwt.verify(token, key);
      if (isAuthTokenPayload(decoded)) {
        return decoded.id;
      } else {
        throw new UnauthorizedError("Invalid auth token");
      }
    } catch (err) {
      // Preserve specific AppError messages from earlier validation.
      if (err instanceof AppError) {
        throw err;
      } else if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Token has expired.");
      } else {
        throw new UnauthorizedError("Invalid auth token.");
      }
    }
  }
}
