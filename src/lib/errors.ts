export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      "INTERNAL_ERROR",
      "An unexpected error occurred.",
      500,
      { originalMessage: error.message },
    );
  }

  return new AppError(
    "INTERNAL_ERROR",
    "An unexpected error occurred.",
    500,
  );
}