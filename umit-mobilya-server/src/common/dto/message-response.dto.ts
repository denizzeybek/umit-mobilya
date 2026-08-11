export class MessageResponseDto {
  /** Human-readable confirmation, safe to show to the user as-is. */
  message!: string;
}

export class ErrorResponseDto {
  /** Repeats the HTTP status, so a client can branch without the response object. */
  statusCode!: number;

  /** What went wrong. The frontend shows this string directly in a toast. */
  message!: string;

  /** The path that failed, for correlating with server logs. */
  path!: string;

  /** One entry per failed field constraint. Absent when nothing field-specific failed. */
  errors?: string[];
}
