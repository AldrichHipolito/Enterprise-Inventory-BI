// src/lib/errors.ts
//
// 17-coding-standards.md: "custom error classes (NotFoundError, ForbiddenError,
// ValidationError, ConflictError) caught by a single Express error-handling
// middleware — no ad hoc res.status(...) scattered through services."
//
// UnauthorizedError is added beyond that list because authentication (401 —
// "who are you?") and authorization (403 — "I know who you are, but no") are
// distinct failure modes that authenticate.ts and authorize.ts each need to
// signal separately.
//
// Usage in a service: `throw new NotFoundError("Product not found")`
// The error-handling middleware (to be added in app.ts) reads `.statusCode`
// and `.message` off whatever it catches.

export abstract class AppError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Maintains a proper stack trace in V8 (Node) — without this, the stack
    // trace would point into this base class instead of the throw site.
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 — the request payload failed Zod validation or is otherwise malformed. */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  constructor(message = "Validation failed", public readonly details?: unknown) {
    super(message);
  }
}

/** 401 — missing, invalid, or expired credentials/token. Also used for the
 *  account-lockout case (FR-1.5) since the caller isn't authenticated yet. */
export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  constructor(message = "Unauthorized") {
    super(message);
  }
}

/** 403 — caller is authenticated, but lacks the required permission or
 *  warehouse scope (authorize.ts / warehouse-scope.ts). */
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  constructor(message = "Forbidden") {
    super(message);
  }
}

/** 404 — record not found (or soft-deleted, which should read the same to
 *  the caller as not existing). */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  constructor(message = "Not found") {
    super(message);
  }
}

/** 409 — the request conflicts with current state (e.g. duplicate SKU/email,
 *  or a stock quantity that would go negative). */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  constructor(message = "Conflict") {
    super(message);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}