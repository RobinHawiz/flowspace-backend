import Fastify, { type FastifyError } from "fastify";
import { fastifyAwilixPlugin } from "@fastify/awilix";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { AppError } from "@errors/appError.js";
import { SchemaValidationError } from "@errors/schemaValidationError.js";

function isFastifyError(err: unknown): err is FastifyError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "name" in err &&
    err.name === "FastifyError" &&
    "statusCode" in err
  );
}

function createLogger() {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  return {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        ignore: "pid,hostname",
      },
    },
  };
}

export default async function build() {
  const app = Fastify({ logger: createLogger() });

  await app.register(cors, {
    origin: process.env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    exposedHeaders: ["Location"],
  });

  await app.register(fastifyAwilixPlugin, { disposeOnClose: true });

  await app.register(cookie, {
    parseOptions: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      signed: false,
    },
  });

  app.setSchemaErrorFormatter(function (errors, dataVar) {
    return new SchemaValidationError(errors[0], dataVar);
  });

  app.setErrorHandler((err, _, reply) => {
    if (err instanceof AppError) {
      if (err.statusCode >= 500) {
        app.log.error(err);
      } else {
        app.log.warn(err);
      }
      reply.code(err.statusCode).send({ message: err.message });
    } else if (err instanceof SchemaValidationError) {
      app.log.warn(err);
      reply.code(err.statusCode).send({ message: err.message });
    } else if (isFastifyError(err)) {
      if (
        err.statusCode !== undefined &&
        err.statusCode >= 400 &&
        err.statusCode < 500
      ) {
        app.log.warn(err);
        reply.code(err.statusCode).send({
          message: err.message,
        });
        return;
      }
      app.log.error(err);
      reply.code(err.statusCode ?? 500).send({ message: err.message });
    } else {
      app.log.error(err);
      reply.code(500).send({ message: "Unexpected server error" });
    }
  });

  return app;
}
