import type { AxiosError } from 'axios';
import type { AppError } from '../types/errors';
import { ErrorCategory } from '../types/errors';

export function handleApiError(error: AxiosError): AppError {
  const timestamp = new Date().toISOString();
  
  if (!error.response) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      category: ErrorCategory.NETWORK,
      timestamp,
      details: error.message,
    };
  }

  const statusCode = error.response.status;
  const responseData = error.response.data as any;

  if (statusCode === 401) {
    return {
      message: 'Your session has expired. Please log in again.',
      code: 'AUTH_ERROR',
      category: ErrorCategory.AUTHENTICATION,
      statusCode,
      timestamp,
      details: responseData,
    };
  }

  if (statusCode === 403) {
    return {
      message: "You don't have permission to perform this action.",
      code: 'FORBIDDEN',
      category: ErrorCategory.AUTHENTICATION,
      statusCode,
      timestamp,
      details: responseData,
    };
  }

  if (statusCode >= 400 && statusCode < 500) {
    const message = responseData?.message || responseData?.error || 'Invalid request. Please check your input.';
    
    if (statusCode === 404) {
      return {
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        category: ErrorCategory.API,
        statusCode,
        timestamp,
        details: responseData,
      };
    }

    if (statusCode === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return {
        message: `Too many requests. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}.`,
        code: 'RATE_LIMIT',
        category: ErrorCategory.API,
        statusCode,
        timestamp,
        details: responseData,
      };
    }

    return {
      message,
      code: 'CLIENT_ERROR',
      category: ErrorCategory.VALIDATION,
      statusCode,
      timestamp,
      details: responseData,
    };
  }

  if (statusCode >= 500) {
    let message = 'Something went wrong on our end. Please try again.';
    
    if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
      message = 'Service temporarily unavailable. Please try again in a moment.';
    }

    return {
      message,
      code: 'SERVER_ERROR',
      category: ErrorCategory.API,
      statusCode,
      timestamp,
      details: responseData,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    category: ErrorCategory.UNKNOWN,
    statusCode,
    timestamp,
    details: responseData,
  };
}

export function handleWebSocketError(error: Error): AppError {
  const timestamp = new Date().toISOString();
  
  if (error.message.includes('timeout')) {
    return {
      message: 'Real-time connection timed out. Attempting to reconnect...',
      code: 'WEBSOCKET_TIMEOUT',
      category: ErrorCategory.WEBSOCKET,
      timestamp,
      details: error.message,
    };
  }

  if (error.message.includes('disconnect')) {
    return {
      message: 'Real-time connection lost. Reconnecting...',
      code: 'WEBSOCKET_DISCONNECTED',
      category: ErrorCategory.WEBSOCKET,
      timestamp,
      details: error.message,
    };
  }

  if (error.message.includes('connect') || error.message.includes('connection')) {
    return {
      message: 'Unable to establish real-time connection. Retrying...',
      code: 'WEBSOCKET_CONNECTION_ERROR',
      category: ErrorCategory.WEBSOCKET,
      timestamp,
      details: error.message,
    };
  }

  return {
    message: 'Real-time connection error occurred.',
    code: 'WEBSOCKET_ERROR',
    category: ErrorCategory.WEBSOCKET,
    timestamp,
    details: error.message,
  };
}

export function handleNetworkError(error: Error): AppError {
  const timestamp = new Date().toISOString();
  
  if (error.message.includes('DNS') || error.message.includes('ENOTFOUND')) {
    return {
      message: 'Unable to reach the server. Please check your internet connection.',
      code: 'DNS_ERROR',
      category: ErrorCategory.NETWORK,
      timestamp,
      details: error.message,
    };
  }

  if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
    return {
      message: 'Request timed out. Please check your connection and try again.',
      code: 'TIMEOUT_ERROR',
      category: ErrorCategory.NETWORK,
      timestamp,
      details: error.message,
    };
  }

  if (error.message.includes('ECONNREFUSED')) {
    return {
      message: 'Unable to connect to the server. The service may be temporarily unavailable.',
      code: 'CONNECTION_REFUSED',
      category: ErrorCategory.NETWORK,
      timestamp,
      details: error.message,
    };
  }

  if (error.message.includes('ENETUNREACH')) {
    return {
      message: 'Network is unreachable. Please check your internet connection.',
      code: 'NETWORK_UNREACHABLE',
      category: ErrorCategory.NETWORK,
      timestamp,
      details: error.message,
    };
  }

  return {
    message: 'Network error occurred. Please check your connection and try again.',
    code: 'NETWORK_ERROR',
    category: ErrorCategory.NETWORK,
    timestamp,
    details: error.message,
  };
}

export function formatErrorMessage(error: AppError): string {
  return error.message;
}

export function isRetryableError(error: AppError): boolean {
  if (error.category === ErrorCategory.NETWORK) {
    return true;
  }

  if (error.category === ErrorCategory.WEBSOCKET) {
    return true;
  }

  if (error.statusCode && error.statusCode >= 500) {
    return true;
  }

  if (error.code.includes('TIMEOUT')) {
    return true;
  }

  if (error.code === 'RATE_LIMIT') {
    return false;
  }

  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return false;
  }

  if (error.category === ErrorCategory.AUTHENTICATION) {
    return false;
  }

  if (error.category === ErrorCategory.VALIDATION) {
    return false;
  }

  return false;
}
