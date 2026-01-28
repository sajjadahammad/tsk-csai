import { describe, it, expect } from 'vitest';
import type { AxiosError } from 'axios';
import {
  handleApiError,
  handleWebSocketError,
  handleNetworkError,
  formatErrorMessage,
  isRetryableError,
} from '../../utils/error-handler';
import { ErrorCategory } from '../../types/errors';
import type { AppError } from '../../types/errors';

describe('Error Handler Utility', () => {
  describe('handleApiError', () => {
    it('should categorize network errors (no response)', () => {
      const axiosError = {
        message: 'Network Error',
        response: undefined,
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Unable to connect');
      expect(result.timestamp).toBeDefined();
    });

    it('should categorize 401 errors as authentication errors', () => {
      const axiosError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.statusCode).toBe(401);
      expect(result.message).toContain('session has expired');
    });

    it('should categorize 403 errors as authentication errors', () => {
      const axiosError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.statusCode).toBe(403);
      expect(result.message).toContain("don't have permission");
    });

    it('should categorize 404 errors as API errors', () => {
      const axiosError = {
        response: {
          status: 404,
          data: { message: 'Not Found' },
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.API);
      expect(result.code).toBe('NOT_FOUND');
      expect(result.statusCode).toBe(404);
      expect(result.message).toContain('not found');
    });

    it('should categorize 429 errors with retry-after header', () => {
      const axiosError = {
        response: {
          status: 429,
          data: { message: 'Too Many Requests' },
          headers: { 'retry-after': '60' },
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.API);
      expect(result.code).toBe('RATE_LIMIT');
      expect(result.statusCode).toBe(429);
      expect(result.message).toContain('Too many requests');
      expect(result.message).toContain('60 seconds');
    });

    it('should categorize 400 errors as validation errors', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Invalid input' },
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.code).toBe('CLIENT_ERROR');
      expect(result.statusCode).toBe(400);
      expect(result.message).toBe('Invalid input');
    });

    it('should categorize 500 errors as server errors', () => {
      const axiosError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.API);
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('Something went wrong');
    });

    it('should categorize 502/503/504 errors as service unavailable', () => {
      const statusCodes = [502, 503, 504];

      statusCodes.forEach((status) => {
        const axiosError = {
          response: {
            status,
            data: {},
            headers: {},
          },
          isAxiosError: true,
        } as unknown as AxiosError;

        const result = handleApiError(axiosError);

        expect(result.category).toBe(ErrorCategory.API);
        expect(result.code).toBe('SERVER_ERROR');
        expect(result.statusCode).toBe(status);
        expect(result.message).toContain('temporarily unavailable');
      });
    });

    it('should handle unknown status codes', () => {
      const axiosError = {
        response: {
          status: 418, // I'm a teapot
          data: {},
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.statusCode).toBe(418);
    });
  });

  describe('handleWebSocketError', () => {
    it('should categorize connection errors', () => {
      const error = new Error('Failed to connect to WebSocket server');

      const result = handleWebSocketError(error);

      expect(result.category).toBe(ErrorCategory.WEBSOCKET);
      expect(result.code).toBe('WEBSOCKET_CONNECTION_ERROR');
      expect(result.message).toContain('Unable to establish');
      expect(result.timestamp).toBeDefined();
    });

    it('should categorize timeout errors', () => {
      const error = new Error('WebSocket connection timeout');

      const result = handleWebSocketError(error);

      expect(result.category).toBe(ErrorCategory.WEBSOCKET);
      expect(result.code).toBe('WEBSOCKET_TIMEOUT');
      expect(result.message).toContain('timed out');
    });

    it('should categorize disconnection errors', () => {
      const error = new Error('WebSocket disconnected unexpectedly');

      const result = handleWebSocketError(error);

      expect(result.category).toBe(ErrorCategory.WEBSOCKET);
      expect(result.code).toBe('WEBSOCKET_DISCONNECTED');
      expect(result.message).toContain('connection lost');
    });

    it('should handle generic WebSocket errors', () => {
      const error = new Error('Unknown WebSocket error');

      const result = handleWebSocketError(error);

      expect(result.category).toBe(ErrorCategory.WEBSOCKET);
      expect(result.code).toBe('WEBSOCKET_ERROR');
      expect(result.message).toContain('Real-time connection error');
    });
  });

  describe('handleNetworkError', () => {
    it('should categorize DNS errors', () => {
      const error = new Error('getaddrinfo ENOTFOUND example.com');

      const result = handleNetworkError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.code).toBe('DNS_ERROR');
      expect(result.message).toContain('Unable to reach');
    });

    it('should categorize timeout errors', () => {
      const error = new Error('Request timeout ETIMEDOUT');

      const result = handleNetworkError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.code).toBe('TIMEOUT_ERROR');
      expect(result.message).toContain('timed out');
    });

    it('should categorize connection refused errors', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:3000');

      const result = handleNetworkError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.code).toBe('CONNECTION_REFUSED');
      expect(result.message).toContain('Unable to connect');
    });

    it('should categorize network unreachable errors', () => {
      const error = new Error('Network unreachable ENETUNREACH');

      const result = handleNetworkError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.code).toBe('NETWORK_UNREACHABLE');
      expect(result.message).toContain('Network is unreachable');
    });

    it('should handle generic network errors', () => {
      const error = new Error('Unknown network error');

      const result = handleNetworkError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Network error occurred');
    });
  });

  describe('formatErrorMessage', () => {
    it('should return the error message from AppError', () => {
      const appError: AppError = {
        message: 'Test error message',
        code: 'TEST_ERROR',
        category: ErrorCategory.API,
        timestamp: new Date().toISOString(),
      };

      const result = formatErrorMessage(appError);

      expect(result).toBe('Test error message');
    });

    it('should handle errors with special characters', () => {
      const appError: AppError = {
        message: 'Error: "Invalid input" - please try again!',
        code: 'TEST_ERROR',
        category: ErrorCategory.VALIDATION,
        timestamp: new Date().toISOString(),
      };

      const result = formatErrorMessage(appError);

      expect(result).toBe('Error: "Invalid input" - please try again!');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error: AppError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        category: ErrorCategory.NETWORK,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for WebSocket errors', () => {
      const error: AppError = {
        message: 'WebSocket error',
        code: 'WEBSOCKET_ERROR',
        category: ErrorCategory.WEBSOCKET,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 5xx server errors', () => {
      const statusCodes = [500, 502, 503, 504];

      statusCodes.forEach((statusCode) => {
        const error: AppError = {
          message: 'Server error',
          code: 'SERVER_ERROR',
          category: ErrorCategory.API,
          statusCode,
          timestamp: new Date().toISOString(),
        };

        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should return true for timeout errors', () => {
      const error: AppError = {
        message: 'Timeout error',
        code: 'TIMEOUT_ERROR',
        category: ErrorCategory.NETWORK,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for rate limit errors', () => {
      const error: AppError = {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        category: ErrorCategory.API,
        statusCode: 429,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for 4xx client errors', () => {
      const statusCodes = [400, 401, 403, 404];

      statusCodes.forEach((statusCode) => {
        const error: AppError = {
          message: 'Client error',
          code: 'CLIENT_ERROR',
          category: ErrorCategory.API,
          statusCode,
          timestamp: new Date().toISOString(),
        };

        expect(isRetryableError(error)).toBe(false);
      });
    });

    it('should return false for authentication errors', () => {
      const error: AppError = {
        message: 'Authentication error',
        code: 'AUTH_ERROR',
        category: ErrorCategory.AUTHENTICATION,
        statusCode: 401,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for validation errors', () => {
      const error: AppError = {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        category: ErrorCategory.VALIDATION,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const error: AppError = {
        message: 'Unknown error',
        code: 'UNKNOWN_ERROR',
        category: ErrorCategory.UNKNOWN,
        timestamp: new Date().toISOString(),
      };

      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle API errors with missing response data', () => {
      const axiosError = {
        response: {
          status: 400,
          data: null,
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.message).toContain('Invalid request');
    });

    it('should handle API errors with empty response data', () => {
      const axiosError = {
        response: {
          status: 500,
          data: {},
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.category).toBe(ErrorCategory.API);
      expect(result.code).toBe('SERVER_ERROR');
    });

    it('should handle 429 errors without retry-after header', () => {
      const axiosError = {
        response: {
          status: 429,
          data: {},
          headers: {},
        },
        isAxiosError: true,
      } as unknown as AxiosError;

      const result = handleApiError(axiosError);

      expect(result.code).toBe('RATE_LIMIT');
      expect(result.message).toContain('later');
      expect(result.message).not.toContain('seconds');
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new Error(longMessage);

      const result = handleNetworkError(error);

      expect(result.details).toBe(longMessage);
      expect(result.category).toBe(ErrorCategory.NETWORK);
    });

    it('should handle errors with special characters in messages', () => {
      const error = new Error('Error: <script>alert("xss")</script>');

      const result = handleNetworkError(error);

      expect(result.details).toContain('<script>');
      expect(result.category).toBe(ErrorCategory.NETWORK);
    });
  });
});
