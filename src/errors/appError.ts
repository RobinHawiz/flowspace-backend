export abstract class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly message: string,
  ) {
    super(message);
  }
}

export class BadRequestError extends AppError {
  constructor(readonly message: string = "Bad Request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(readonly message: string = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(readonly message: string = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(readonly message: string = "Not Found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(readonly message: string = "Conflict") {
    super(409, message);
  }
}

export class InternalServerError extends AppError {
  constructor(readonly message: string = "Internal Server Error") {
    super(500, message);
  }
}
