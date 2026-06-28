export type AppErrorInput<TDetails = unknown> = {
  code: string;
  details?: TDetails;
  message: string;
  statusCode?: number;
};

export class AppError<TDetails = unknown> extends Error {
  readonly code: string;
  readonly details?: TDetails;
  readonly statusCode: number;

  constructor(input: AppErrorInput<TDetails>) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.statusCode = input.statusCode ?? 500;

    if ("details" in input) {
      this.details = input.details;
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
