import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListQuery } from '../../hooks/use-data-queries';
import type { ReactNode } from 'react';

/**
 * Property-Based Test: Query Lifecycle States
 * 
 * Property 2: Query Lifecycle States
 * **Validates: Requirements 2.2, 2.3, 2.4**
 * 
 * This property test verifies that for any React Query data fetching operation,
 * the query should expose:
 * - loading state while fetching (isLoading = true)
 * - error state when failed with error details (isError = true, error object present)
 * - cached data when successful (data present, isLoading = false)
 * 
 * The test runs 100+ iterations with random query configurations to ensure
 * the property holds across all query scenarios.
 */
describe('Property-Based Test: Query Lifecycle States', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });
  });

  const createWrapper = () => {
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it(
    'should expose loading state while fetching (100+ iterations)',
    { timeout: 30000 },
    async () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
      // Create a fresh QueryClient for each iteration
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
          },
        },
      });

      // Generate random delay to simulate network latency
      const randomDelay = Math.floor(Math.random() * 100) + 50; // 50-150ms

      // Generate random page and pageSize
      const randomPage = Math.floor(Math.random() * 10) + 1;
      const randomPageSize = Math.floor(Math.random() * 20) + 5; // 5-25 items

      // Create a fetcher that simulates async data fetching
      const mockFetcher = vi.fn(async ({ page, pageSize }) => {
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
        return Array.from({ length: pageSize }, (_, idx) => ({
          id: page * pageSize + idx,
          title: `Item ${page * pageSize + idx}`,
        }));
      });

      // Generate random query key
      const queryKey = [`test-query-${i}`, Math.random().toString(36).substring(7)];

      const { result } = renderHook(
        () =>
          useListQuery(queryKey, mockFetcher, {
            page: randomPage,
            pageSize: randomPageSize,
          }),
        { wrapper: createWrapper() }
      );

      // Property: Initially, the query should be in loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Property: After successful fetch, data should be present and loading should be false
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBe(randomPageSize);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    }
  });

  it(
    'should expose error state when fetch fails with error details (100+ iterations)',
    { timeout: 30000 },
    async () => {
      const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Create a fresh QueryClient for each iteration
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
          },
        },
      });

      // Generate random delay
      const randomDelay = Math.floor(Math.random() * 100) + 50;

      // Generate random error messages and codes
      const errorMessages = [
        'Network error',
        'Server error',
        'Timeout',
        'Not found',
        'Unauthorized',
        'Forbidden',
      ];
      const randomErrorMessage =
        errorMessages[Math.floor(Math.random() * errorMessages.length)];
      const randomStatusCode = [400, 401, 403, 404, 500, 502, 503][
        Math.floor(Math.random() * 7)
      ];

      // Create a fetcher that always fails
      const mockFetcher = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
        const error = new Error(randomErrorMessage) as Error & { statusCode?: number };
        error.statusCode = randomStatusCode;
        throw error;
      });

      // Generate random query key
      const queryKey = [`error-query-${i}`, Math.random().toString(36).substring(7)];

      const { result } = renderHook(
        () =>
          useListQuery(queryKey, mockFetcher, {
            page: 1,
            pageSize: 10,
          }),
        { wrapper: createWrapper() }
      );

      // Property: Initially, the query should be in loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);

      // Wait for the query to fail
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Property: After failed fetch, error state should be exposed with error details
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(randomErrorMessage);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    }
  });

  it(
    'should cache data when successful and expose it on subsequent renders (100+ iterations)',
    { timeout: 30000 },
    async () => {
      const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Create a fresh QueryClient for each iteration
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
            staleTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      });

      // Generate random data
      const randomPageSize = Math.floor(Math.random() * 20) + 5;
      const randomData = Array.from({ length: randomPageSize }, (_, idx) => ({
        id: idx,
        title: `Cached Item ${idx}`,
        value: Math.random(),
      }));

      let fetchCount = 0;
      const mockFetcher = vi.fn(async () => {
        fetchCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return randomData;
      });

      // Generate random query key
      const queryKey = [`cache-query-${i}`, Math.random().toString(36).substring(7)];

      // First render - should fetch data
      const { result, rerender } = renderHook(
        () =>
          useListQuery(queryKey, mockFetcher, {
            page: 1,
            pageSize: randomPageSize,
          }),
        { wrapper: createWrapper() }
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Property: After successful fetch, data should be cached
      expect(result.current.data).toEqual(randomData);
      expect(fetchCount).toBe(1);

      // Second render - should use cached data
      rerender();

      // Property: Cached data should be immediately available without loading state
      expect(result.current.data).toEqual(randomData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(fetchCount).toBe(1); // Should not fetch again

      // Third render - should still use cached data
      rerender();

      expect(result.current.data).toEqual(randomData);
      expect(result.current.isLoading).toBe(false);
      expect(fetchCount).toBe(1); // Should still not fetch again
    }
  });

  it(
    'should transition through all lifecycle states correctly (100+ iterations)',
    { timeout: 30000 },
    async () => {
      const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Create a fresh QueryClient for each iteration
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
          },
        },
      });

      // Generate random configuration
      const randomDelay = Math.floor(Math.random() * 100) + 50;
      const shouldSucceed = Math.random() > 0.5; // 50% success, 50% failure

      const mockFetcher = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, randomDelay));
        if (shouldSucceed) {
          return [{ id: 1, data: 'success' }];
        } else {
          throw new Error('Random failure');
        }
      });

      const queryKey = [`lifecycle-query-${i}`, Math.random().toString(36).substring(7)];

      const { result } = renderHook(
        () =>
          useListQuery(queryKey, mockFetcher, {
            page: 1,
            pageSize: 10,
          }),
        { wrapper: createWrapper() }
      );

      // Property: State 1 - Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();

      // Wait for state transition
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (shouldSucceed) {
        // Property: State 2a - Success state
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.data).toBeDefined();
        expect(result.current.error).toBeNull();
      } else {
        // Property: State 2b - Error state
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
        expect(result.current.data).toBeUndefined();
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Random failure');
      }
    }
  });

  it(
    'should handle refetch and maintain correct lifecycle states (100+ iterations)',
    { timeout: 30000 },
    async () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        // Create a fresh QueryClient for each iteration
        queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
              gcTime: Infinity,
            },
          },
        });

        let callCount = 0;
        const mockFetcher = vi.fn(async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return [{ id: callCount, data: `fetch-${callCount}` }];
        });

        const queryKey = [`refetch-query-${i}`, Math.random().toString(36).substring(7)];

        const { result } = renderHook(
          () =>
            useListQuery(queryKey, mockFetcher, {
              page: 1,
              pageSize: 10,
            }),
          { wrapper: createWrapper() }
        );

        // Wait for initial fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Property: After initial fetch, data should be available
        expect(result.current.data).toEqual([{ id: 1, data: 'fetch-1' }]);
        expect(callCount).toBe(1);

        // Trigger refetch
        const refetchPromise = result.current.refetch();

        // Wait for refetch to complete
        await refetchPromise;

        // Property: After refetch, fetcher should be called again
        expect(callCount).toBe(2);
        
        // Property: After refetch, new data should be available
        await waitFor(() => {
          expect(result.current.data).toEqual([{ id: 2, data: 'fetch-2' }]);
        });
        
        expect(result.current.isLoading).toBe(false);
      }
    }
  );
});
