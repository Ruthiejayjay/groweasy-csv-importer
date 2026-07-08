export enum ErrorCode {
  NO_FILE_UPLOADED = "NO_FILE_UPLOADED",
  INVALID_CSV = "INVALID_CSV",
  EMPTY_CSV = "EMPTY_CSV",
  AI_EXTRACTION_FAILED = "AI_EXTRACTION_FAILED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class AppError extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AppError";
  }
}
