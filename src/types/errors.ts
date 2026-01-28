export const ErrorCategory = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  WEBSOCKET: 'WEBSOCKET_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

export interface AppError {
  message: string;
  code: string;
  category: ErrorCategory;
  statusCode?: number;
  details?: any;
  timestamp: string;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCategory[];
}
