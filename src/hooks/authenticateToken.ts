import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  AppError,
  ForbiddenError,
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
 * Verifies the bearer token for protected routes and attaches the decoded JWT payload to `request.user`.
 *
 * @throws `UnauthorizedError` if no token is provided.
 * @throws `ForbiddenError` if the token is invalid.
 */
export default async function authenticateToken(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new UnauthorizedError("Missing bearer token.");
  }

  const [type, token] = authHeader.split(" ");
  if (!token || type !== "Bearer") {
    throw new UnauthorizedError("Missing bearer token.");
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
      throw new ForbiddenError("Invalid token payload.");
    }
  } catch (err) {
    // Preserve specific AppError messages from earlier validation.
    if (err instanceof AppError) {
      throw err;
    }
    throw new ForbiddenError("Invalid token.");
  }
}
