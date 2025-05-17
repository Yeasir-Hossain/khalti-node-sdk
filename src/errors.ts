/**
 * Custom error class for Khalti API errors
 */
export class KhaltiError extends Error {
  /** Error code or key */
  public readonly code: string
  /** HTTP status code */
  public readonly statusCode: number

  /**
   * Create a new Khalti error
   *
   * @param code Error code or key
   * @param message Error message
   * @param statusCode HTTP status code
   */
  constructor(code: string, message: string, statusCode: number) {
    super(message)
    this.name = "KhaltiError"
    this.code = code
    this.statusCode = statusCode

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KhaltiError)
    }
  }
}

/**
 * Error codes used by the Khalti API
 */
export enum ErrorCode {
  VALIDATION_ERROR = "validation_error",
  AUTHENTICATION_ERROR = "authentication_error",
  AUTHORIZATION_ERROR = "authorization_error",
  RESOURCE_NOT_FOUND = "resource_not_found",
  DUPLICATE_RESOURCE = "duplicate_resource",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  INTERNAL_SERVER_ERROR = "internal_server_error",
  SERVICE_UNAVAILABLE = "service_unavailable",
  NETWORK_ERROR = "network_error",
  UNKNOWN_ERROR = "unknown_error",
}
