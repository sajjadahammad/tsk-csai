import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getRetryDelay,
  shouldRetry,
  withRetry,
  createRetryConfig,
  DEFAULT_RETRY_CONFIG,
} from '../../utils/retry';
import type { RetryConfig } from '../../types/errors';

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff for attempt 0', () => {
      const delay = getRetryDelay(0, DEFAULT_RETRY_CONFIG);
      // initialDelay * (backoffMultiplier ^ 0) = 1000 * (2 ^ 0) = 1000 * 1 = 1000
      expect(delay).toBe(1000);
    });

    it('should calculate exponential backoff for attempt 1', () => {
      const delay = getRetryDelay(1, DEFAULT_RETRY_CONFIG);
      // initialDelay * (backoffMultiplier ^ 1) = 1000 * (2 ^ 1) = 1000 * 2 = 2000
      expect(delay).toBe(2000);
    });

    it('should calculate exponential backoff for attempt 2', () => {
      const delay = getRetryDelay(2, DEFAULT_RETRY_CONFIG);
      // initialDelay * (backoffMultiplier ^ 2) = 1000 * (2 ^ 2) = 1000 * 4 = 4000
      expect(delay).toBe(4000);
    });

    it('should calculate exponential backoff for attempt 3', () => {
      const delay = getRetryDelay(3, DEFAULT_RETRY_CONFIG);
      // initialDelay * (backoffMultiplier ^ 3) = 1000 * (2 ^ 3) = 1000 * 8 = 8000
      expect(delay).toBe(8000);
    });

    it('should cap delay at maxDelay', () => {
      const delay = getRetryDelay(10, DEFAULT_RETRY_CONFIG);
      // initialDelay * (backoffMultiplier ^ 10) = 1000 * (2 ^ 10) = 1000 * 1024 = 1024000
      // But should be capped at maxDelay = 30000
      expect(delay).toBe(30000);
    });

    it('should handle custom configuration', () => {
      const customConfig = {
        initialDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 3,
      };

      const delay = getRetryDelay(2, customConfig);
      // 500 * (3 ^ 2) = 500 * 9 = 4500
      expect(delay).toBe(4500);
    });

    it('should cap at maxDelay with custom configuration', () => {
      const customConfig = {
        initialDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 3,
      };

      const delay = getRetryDelay(3, customConfig);
      // 500 * (3 ^ 3) = 500 * 27 = 13500, capped at 5000
      expect(delay).toBe(5000);
    });

    it('should handle backoffMultiplier of 1 (linear backoff)', () => {
      const config = {
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 1,
      };

      expect(getRetryDelay(0, config)).toBe(1000);
      expect(getRetryDelay(1, config)).toBe(1000);
      expect(getRetryDelay(5, config)).toBe(1000);
    });

    it('should handle attempt 0 correctly', () => {
      const delay = getRetryDelay(0, {
        initialDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      });
      // 2000 * (2 ^ 0) = 2000 * 1 = 2000
      expect(delay).toBe(2000);
    });
  });

  describe('shouldRetry', () => {
    it('should return true when attempt is less than maxAttempts', () => {
      expect(shouldRetry(0, { maxAttempts: 3 })).toBe(true);
      expect(shouldRetry(1, { maxAttempts: 3 })).toBe(true);
      expect(shouldRetry(2, { maxAttempts: 3 })).toBe(true);
    });

    it('should return false when attempt equals maxAttempts', () => {
      expect(shouldRetry(3, { maxAttempts: 3 })).toBe(false);
    });

    it('should return false when attempt exceeds maxAttempts', () => {
      expect(shouldRetry(4, { maxAttempts: 3 })).toBe(false);
      expect(shouldRetry(10, { maxAttempts: 3 })).toBe(false);
    });

    it('should handle maxAttempts of 1', () => {
      expect(shouldRetry(0, { maxAttempts: 1 })).toBe(true);
      expect(shouldRetry(1, { maxAttempts: 1 })).toBe(false);
    });

    it('should handle maxAttempts of 0', () => {
      expect(shouldRetry(0, { maxAttempts: 0 })).toBe(false);
    });

    it('should use default config when not provided', () => {
      // DEFAULT_RETRY_CONFIG has maxAttempts: 3
      expect(shouldRetry(0)).toBe(true);
      expect(shouldRetry(2)).toBe(true);
      expect(shouldRetry(3)).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation, DEFAULT_RETRY_CONFIG);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue('success');

      const promise = withRetry(operation, DEFAULT_RETRY_CONFIG);

      // Fast-forward through all timers
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts exceeded', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);

      const promise = withRetry(operation, {
        ...DEFAULT_RETRY_CONFIG,
        maxAttempts: 3,
      }).catch(err => err); // Catch to prevent unhandled rejection

      // Fast-forward through all timers
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Operation failed');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect exponential backoff delays', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValue('success');

      const config = {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        retryableErrors: [],
      };

      const promise = withRetry(operation, config);

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Wait for first retry delay (1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(operation).toHaveBeenCalledTimes(2);

      // Wait for second retry delay (2000ms)
      await vi.advanceTimersByTimeAsync(2000);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should not retry when shouldRetryError returns false', async () => {
      const error = new Error('Non-retryable error');
      const operation = vi.fn().mockRejectedValue(error);
      const shouldRetryError = vi.fn().mockReturnValue(false);

      const promise = withRetry(operation, DEFAULT_RETRY_CONFIG, shouldRetryError);

      await expect(promise).rejects.toThrow('Non-retryable error');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetryError).toHaveBeenCalledWith(error);
    });

    it('should retry when shouldRetryError returns true', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Retryable error'))
        .mockResolvedValue('success');
      const shouldRetryError = vi.fn().mockReturnValue(true);

      const promise = withRetry(operation, DEFAULT_RETRY_CONFIG, shouldRetryError);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(shouldRetryError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle different error types with shouldRetryError', async () => {
      class NetworkError extends Error {
        name = 'NetworkError';
      }

      const operation = vi.fn()
        .mockRejectedValueOnce(new NetworkError('Network failed'))
        .mockRejectedValueOnce(new NetworkError('Network failed again'))
        .mockResolvedValue('success');

      const shouldRetryError = (error: any) => error.name === 'NetworkError';

      const promise = withRetry(operation, DEFAULT_RETRY_CONFIG, shouldRetryError);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should stop retrying on non-retryable error even with attempts left', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Validation failed'));

      const shouldRetryError = (error: any) => !error.message.includes('Validation');

      const promise = withRetry(operation, DEFAULT_RETRY_CONFIG, shouldRetryError).catch(err => err);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Validation failed');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle async operations that take time', async () => {
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      });

      const promise = withRetry(operation, DEFAULT_RETRY_CONFIG);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRetryConfig', () => {
    it('should return default config when no overrides provided', () => {
      const config = createRetryConfig();

      expect(config).toEqual(DEFAULT_RETRY_CONFIG);
    });

    it('should override specific properties', () => {
      const config = createRetryConfig({
        maxAttempts: 5,
        initialDelay: 500,
      });

      expect(config).toEqual({
        maxAttempts: 5,
        initialDelay: 500,
        maxDelay: 30000,
        backoffMultiplier: 2,
        retryableErrors: [],
      });
    });

    it('should override all properties', () => {
      const customConfig: RetryConfig = {
        maxAttempts: 10,
        initialDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3,
        retryableErrors: [],
      };

      const config = createRetryConfig(customConfig);

      expect(config).toEqual(customConfig);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large attempt numbers', () => {
      const delay = getRetryDelay(100, DEFAULT_RETRY_CONFIG);
      expect(delay).toBe(DEFAULT_RETRY_CONFIG.maxDelay);
    });

    it('should handle zero initialDelay', () => {
      const delay = getRetryDelay(5, {
        initialDelay: 0,
        maxDelay: 10000,
        backoffMultiplier: 2,
      });
      expect(delay).toBe(0);
    });

    it('should handle operation that throws non-Error objects', async () => {
      const operation = vi.fn().mockRejectedValue('string error');

      const promise = withRetry(operation, {
        ...DEFAULT_RETRY_CONFIG,
        maxAttempts: 2,
      }).catch(err => err);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('string error');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle operation that returns undefined', async () => {
      const operation = vi.fn().mockResolvedValue(undefined);

      const result = await withRetry(operation, DEFAULT_RETRY_CONFIG);

      expect(result).toBeUndefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Property-Based Test: Exponential Backoff Formula
   * 
   * Property 10: Automatic Retry with Backoff
   * **Validates: Requirements 5.9, 5.10**
   * 
   * This property test verifies that retry delays follow the exponential backoff formula:
   * delay = min(initialDelay × (backoffMultiplier ^ attempt), maxDelay)
   * 
   * The test runs 100 iterations with random configurations to ensure the formula
   * holds across a wide range of inputs.
   */
  describe('Property-Based Test: Exponential Backoff', () => {
    it('should follow exponential backoff formula for all random configurations (100 iterations)', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Generate random configuration values
        const initialDelay = Math.floor(Math.random() * 5000) + 100; // 100-5100ms
        const maxDelay = Math.floor(Math.random() * 50000) + 10000; // 10000-60000ms
        const backoffMultiplier = Math.random() * 4 + 1; // 1-5
        const attempt = Math.floor(Math.random() * 10); // 0-9
        
        const config = {
          initialDelay,
          maxDelay,
          backoffMultiplier,
        };
        
        // Get the actual delay from the function
        const actualDelay = getRetryDelay(attempt, config);
        
        // Calculate the expected delay using the formula
        const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);
        const expectedDelay = Math.min(exponentialDelay, maxDelay);
        
        // Verify the property holds
        expect(actualDelay).toBe(expectedDelay);
        
        // Additional property: delay should never exceed maxDelay
        expect(actualDelay).toBeLessThanOrEqual(maxDelay);
        
        // Additional property: delay should be non-negative
        expect(actualDelay).toBeGreaterThanOrEqual(0);
        
        // Additional property: for attempt 0, delay should equal initialDelay (if not capped)
        if (attempt === 0) {
          expect(actualDelay).toBe(Math.min(initialDelay, maxDelay));
        }
      }
    });

    it('should ensure delays increase exponentially until capped at maxDelay', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Generate random configuration
        const initialDelay = Math.floor(Math.random() * 1000) + 100; // 100-1100ms
        const maxDelay = Math.floor(Math.random() * 20000) + 5000; // 5000-25000ms
        const backoffMultiplier = Math.random() * 2 + 1.5; // 1.5-3.5
        
        const config = {
          initialDelay,
          maxDelay,
          backoffMultiplier,
        };
        
        let previousDelay = 0;
        let reachedMax = false;
        
        // Test delays for attempts 0-9
        for (let attempt = 0; attempt < 10; attempt++) {
          const delay = getRetryDelay(attempt, config);
          
          // Property: delay should be monotonically increasing or equal (when capped)
          expect(delay).toBeGreaterThanOrEqual(previousDelay);
          
          // Property: once maxDelay is reached, all subsequent delays should equal maxDelay
          if (reachedMax) {
            expect(delay).toBe(maxDelay);
          }
          
          if (delay === maxDelay) {
            reachedMax = true;
          }
          
          previousDelay = delay;
        }
      }
    });

    it('should handle edge cases with random extreme values', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Test with extreme values
        const scenarios = [
          // Very small delays
          {
            initialDelay: Math.random() * 10 + 1, // 1-11ms
            maxDelay: Math.random() * 100 + 50, // 50-150ms
            backoffMultiplier: 2,
          },
          // Very large delays
          {
            initialDelay: Math.floor(Math.random() * 10000) + 5000, // 5000-15000ms
            maxDelay: Math.floor(Math.random() * 100000) + 50000, // 50000-150000ms
            backoffMultiplier: 2,
          },
          // Small backoff multiplier (near 1)
          {
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 1 + Math.random() * 0.5, // 1-1.5
          },
          // Large backoff multiplier
          {
            initialDelay: 100,
            maxDelay: 100000,
            backoffMultiplier: Math.random() * 5 + 5, // 5-10
          },
        ];
        
        const scenario = scenarios[i % scenarios.length];
        const attempt = Math.floor(Math.random() * 15);
        
        const delay = getRetryDelay(attempt, scenario);
        
        // Property: result must be a valid number
        expect(typeof delay).toBe('number');
        expect(Number.isFinite(delay)).toBe(true);
        expect(Number.isNaN(delay)).toBe(false);
        
        // Property: delay must be within bounds
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(scenario.maxDelay);
        
        // Property: verify formula
        const expected = Math.min(
          scenario.initialDelay * Math.pow(scenario.backoffMultiplier, attempt),
          scenario.maxDelay
        );
        expect(delay).toBe(expected);
      }
    });
  });
});
