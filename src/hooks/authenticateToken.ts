import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  AppError,
  InternalServerError,
  UnauthorizedError,
} from "@/errors/appError.js";
import { AuthTokenPayload } from "@models/auth.js";

function isAuthTokenPayload(
  payload: AuthTokenPayload | JwtPayload | string,
): payload is AuthTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "number"
  );
}

/**
 * Verifies the auth cookie for protected routes and attaches the
 * decoded JWT payload to `request.user`.
 *
 * @throws `UnauthorizedError` if no auth token is provided.
 * @throws `ForbiddenError` if the auth token is invalid.
 */
export default async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.cookies.token;
  if (!token) {
    throw new UnauthorizedError("Missing auth token.");
  }

  try {
    const key = process.env.JWT_SECRET_KEY;
    if (!key) {
      throw new InternalServerError(
        "Missing JWT_SECRET_KEY environment variable.",
      );
    }
    const decoded = jwt.verify(token, key);
    if (isAuthTokenPayload(decoded)) {
      request.user = decoded;
    } else {
      reply.clearCookie("token");
      throw new UnauthorizedError("Invalid auth token.");
    }
  } catch (err) {
    // Preserve specific AppError messages from earlier validation.
    if (err instanceof AppError) {
      throw err;
    } else if (err instanceof jwt.TokenExpiredError) {
      reply.clearCookie("token");
      throw new UnauthorizedError("Token has expired.");
    } else {
      reply.clearCookie("token");
      throw new UnauthorizedError("Invalid auth token.");
    }
  }
}
