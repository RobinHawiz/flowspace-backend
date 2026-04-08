import { FastifySchemaValidationError } from "fastify";

export class SchemaValidationError extends Error {
  readonly statusCode = 400;

  constructor(
    readonly error: FastifySchemaValidationError,
    readonly dataVar: "params" | "headers" | "body" | "querystring",
  ) {
    super(`${dataVar}${error.instancePath} ${error.message}`);
  }
}
