import { FastifyRequest, FastifyReply } from "fastify";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError, UnauthorizedError } from "@/errors/appError.js";
import { AuthTokenPayload } from "@models/auth.js";

export function isAuthTokenPayload(
  payload: AuthTokenPayload | JwtPayload | string,
): payload is AuthTokenPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "string"
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
    const key = process.env.JWT_SECRET_KEY!;
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

/**
 * Attempts to decode the auth cookie and attach `request.user` for logout.
 *
 * Logout should still succeed when the token is missing, expired, or invalid,
 * so this hook falls back to an empty user id instead of throwing.
 */
export async function attachOptionalUserForLogout(
  request: FastifyRequest,
  _: FastifyReply,
) {
  const token = request.cookies.token;
  if (!token) {
    request.user = { id: "" };
    return;
  }
  try {
    const key = process.env.JWT_SECRET_KEY!;
    const decoded = jwt.verify(token, key);
    if (isAuthTokenPayload(decoded)) {
      request.user = decoded;
    }
  } catch {
    request.user = { id: "" };
  }
}
