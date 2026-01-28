import type { RetryConfig } from '../types/errors';

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [],
};

export function getRetryDelay(
  attempt: number,
  config: Pick<RetryConfig, 'initialDelay' | 'maxDelay' | 'backoffMultiplier'> = DEFAULT_RETRY_CONFIG
): number {
  const { initialDelay, maxDelay, backoffMultiplier } = config;
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(exponentialDelay, maxDelay);
}

export function shouldRetry(
  attempt: number,
  config: Pick<RetryConfig, 'maxAttempts'> = DEFAULT_RETRY_CONFIG
): boolean {
  return attempt < config.maxAttempts;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetryError?: (error: any) => boolean
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      
      if (shouldRetryError && !shouldRetryError(error)) {
        throw error;
      }
      
      const hasMoreAttempts = shouldRetry(attempt + 1, config);
      
      if (!hasMoreAttempts) {
        throw error;
      }
      
      const delay = getRetryDelay(attempt, config);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export function createRetryConfig(overrides: Partial<RetryConfig> = {}): RetryConfig {
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...overrides,
  };
}
