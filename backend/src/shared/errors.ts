export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const assert: (condition: unknown, error: AppError) => asserts condition = (condition, error) => {
  if (!condition) throw error;
};

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') { super(message, 404, 'NOT_FOUND'); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401, 'UNAUTHORIZED'); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403, 'FORBIDDEN'); }
}
export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: unknown) { super(message, 422, 'VALIDATION_ERROR', details); }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(message, 409, 'CONFLICT'); }
}
