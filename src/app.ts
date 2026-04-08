import Fastify from "fastify";
import { fastifyAwilixPlugin } from "@fastify/awilix";
import cors from "@fastify/cors";
import { AppError } from "@errors/appError.js";
import { SchemaValidationError } from "@errors/schemaValidationError.js";

export default async function build() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGINS ?? "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    exposedHeaders: ["Location"],
  });

  await app.register(fastifyAwilixPlugin, { disposeOnClose: true });

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
    } else {
      app.log.error(err);
      reply.code(500).send({ message: "Unexpected server error" });
    }
  });

  return app;
}
