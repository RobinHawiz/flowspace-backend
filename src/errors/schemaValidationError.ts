import { FastifySchemaValidationError } from "fastify";

export class SchemaValidationError extends Error {
  readonly statusCode = 400;

  constructor(
    readonly error: FastifySchemaValidationError,
    readonly dataVar: "params" | "headers" | "body" | "querystring",
  ) {
    const params = Object.entries(error.params).map(
      ([key, value]) => `[${key}: ${value}]`,
    );

    super(`${dataVar}${error.instancePath} ${error.message} ${params}`);
  }
}
