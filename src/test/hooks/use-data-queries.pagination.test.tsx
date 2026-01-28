import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListQuery } from '../../hooks/use-data-queries';
import type { ReactNode } from 'react';

/**
 * Property-Based Test: Pagination Consistency
 * 
 * Property 3: Pagination Consistency
 * **Validates: Requirements 2.5**
 * 
 * This property test verifies that for any paginated list query:
 * 1. Requesting page N with page size S returns at most S items
 * 2. Pagination metadata accurately reflects the current page and size
 * 3. The hook correctly handles various page numbers and sizes
 * 
 * The test runs 100+ iterations with random page numbers and sizes to ensure
 * the property holds across all pagination configurations.
 */
describe('Property-Based Test: Pagination Consistency', () => {
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

  it('should return at most S items for page N with size S (100+ iterations)', { timeout: 30000 }, async () => {
    const iterations = 100;
    const results: Array<{
      iteration: number;
      page: number;
      pageSize: number;
      returnedItems: number;
      passed: boolean;
    }> = [];

    for (let i = 0; i < iterations; i++) {
      // Generate random page number (1-10)
      const randomPage = Math.floor(Math.random() * 10) + 1;
      
      // Generate random page size (1-50)
      const randomPageSize = Math.floor(Math.random() * 50) + 1;
      
      // Generate a random total number of items available (to simulate different scenarios)
      const totalItems = Math.floor(Math.random() * 500) + 1;
      
      // Calculate how many items should be returned for this page
      const startIndex = (randomPage - 1) * randomPageSize;
      const expectedItemCount = Math.min(
        randomPageSize,
        Math.max(0, totalItems - startIndex)
      );
      
      // Create a mock fetcher that returns the appropriate number of items
      const mockFetcher = vi.fn(async ({ page, pageSize }) => {
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, totalItems);
        
        // Return empty array if start is beyond total items
        if (start >= totalItems) {
          return [];
        }
        
        // Generate mock items for this page
        return Array.from({ length: end - start }, (_, index) => ({
          id: start + index + 1,
          title: `Item ${start + index + 1}`,
          body: `Body for item ${start + index + 1}`,
          userId: Math.floor(Math.random() * 10) + 1,
        }));
      });

      // Create a fresh query client for each iteration
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      );

      // Render the hook with random pagination parameters
      const { result } = renderHook(
        () =>
          useListQuery(
            ['test-pagination', i], // Unique key for each iteration
            mockFetcher,
            {
              page: randomPage,
              pageSize: randomPageSize,
            }
          ),
        { wrapper }
      );

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Property 1: Returned items should be at most pageSize
      const returnedItemCount = result.current.data?.length ?? 0;
      const property1Passed = returnedItemCount <= randomPageSize;

      // Property 2: If there are items available, returned count should match expected
      const property2Passed = returnedItemCount === expectedItemCount;

      // Property 3: Fetcher should be called with correct parameters
      expect(mockFetcher).toHaveBeenCalledWith({
        page: randomPage,
        pageSize: randomPageSize,
      });

      // Property 4: hasNextPage should be true only if we got a full page
      const property4Passed = 
        result.current.hasNextPage === (returnedItemCount === randomPageSize);

      const allPropertiesPassed = 
        property1Passed && property2Passed && property4Passed;

      results.push({
        iteration: i + 1,
        page: randomPage,
        pageSize: randomPageSize,
        returnedItems: returnedItemCount,
        passed: allPropertiesPassed,
      });

      // Assert properties for this iteration
      expect(
        returnedItemCount,
        `Iteration ${i + 1}: Page ${randomPage} with size ${randomPageSize} returned ${returnedItemCount} items, expected at most ${randomPageSize}`
      ).toBeLessThanOrEqual(randomPageSize);

      expect(
        returnedItemCount,
        `Iteration ${i + 1}: Page ${randomPage} with size ${randomPageSize} returned ${returnedItemCount} items, expected exactly ${expectedItemCount}`
      ).toBe(expectedItemCount);

      expect(
        result.current.hasNextPage,
        `Iteration ${i + 1}: hasNextPage should be ${returnedItemCount === randomPageSize} when ${returnedItemCount} items returned with page size ${randomPageSize}`
      ).toBe(returnedItemCount === randomPageSize);

      // Cleanup
      testQueryClient.clear();
    }

    // Summary statistics
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;

    console.log('\n=== Pagination Property Test Summary ===');
    console.log(`Total iterations: ${iterations}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Success rate: ${((passedCount / iterations) * 100).toFixed(2)}%`);

    if (failedCount > 0) {
      console.log('\nFailed iterations:');
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(
            `  Iteration ${r.iteration}: page=${r.page}, pageSize=${r.pageSize}, returned=${r.returnedItems}`
          );
        });
    }

    // All iterations should pass
    expect(passedCount).toBe(iterations);
  });

  it('should correctly handle pagination metadata with various configurations', async () => {
    const testCases = [
      // Edge cases
      { page: 1, pageSize: 1, totalItems: 100, description: 'minimum page size' },
      { page: 1, pageSize: 100, totalItems: 100, description: 'page size equals total items' },
      { page: 1, pageSize: 50, totalItems: 25, description: 'page size larger than total items' },
      { page: 5, pageSize: 10, totalItems: 45, description: 'last page with partial items' },
      { page: 10, pageSize: 10, totalItems: 50, description: 'page beyond available data' },
      
      // Random cases
      ...Array.from({ length: 50 }, (_, i) => ({
        page: Math.floor(Math.random() * 20) + 1,
        pageSize: Math.floor(Math.random() * 50) + 1,
        totalItems: Math.floor(Math.random() * 1000) + 1,
        description: `random case ${i + 1}`,
      })),
    ];

    for (const testCase of testCases) {
      const { page, pageSize, totalItems, description } = testCase;

      // Calculate expected values
      const startIndex = (page - 1) * pageSize;
      const expectedItemCount = Math.min(
        pageSize,
        Math.max(0, totalItems - startIndex)
      );
      const expectedHasNextPage = expectedItemCount === pageSize;

      // Create mock fetcher
      const mockFetcher = vi.fn(async ({ page: p, pageSize: ps }) => {
        const start = (p - 1) * ps;
        const end = Math.min(start + ps, totalItems);

        if (start >= totalItems) {
          return [];
        }

        return Array.from({ length: end - start }, (_, index) => ({
          id: start + index + 1,
          title: `Item ${start + index + 1}`,
          body: `Body ${start + index + 1}`,
          userId: 1,
        }));
      });

      // Create fresh query client
      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      );

      // Render hook
      const { result } = renderHook(
        () =>
          useListQuery(
            ['pagination-metadata', description],
            mockFetcher,
            { page, pageSize }
          ),
        { wrapper }
      );

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify pagination metadata
      const returnedCount = result.current.data?.length ?? 0;

      expect(
        returnedCount,
        `${description}: Expected ${expectedItemCount} items for page ${page} with size ${pageSize} and ${totalItems} total items`
      ).toBe(expectedItemCount);

      expect(
        result.current.hasNextPage,
        `${description}: hasNextPage should be ${expectedHasNextPage}`
      ).toBe(expectedHasNextPage);

      // Verify fetcher was called with correct params
      expect(mockFetcher).toHaveBeenCalledWith({ page, pageSize });

      // Cleanup
      testQueryClient.clear();
    }
  });

  it('should handle edge cases: empty results, first page, and beyond last page', async () => {
    const edgeCases = [
      {
        name: 'empty dataset',
        page: 1,
        pageSize: 10,
        totalItems: 0,
        expectedItems: 0,
        expectedHasNextPage: false,
      },
      {
        name: 'first page with full results',
        page: 1,
        pageSize: 10,
        totalItems: 100,
        expectedItems: 10,
        expectedHasNextPage: true,
      },
      {
        name: 'last page with partial results',
        page: 10,
        pageSize: 10,
        totalItems: 95,
        expectedItems: 5,
        expectedHasNextPage: false,
      },
      {
        name: 'page beyond last page',
        page: 20,
        pageSize: 10,
        totalItems: 50,
        expectedItems: 0,
        expectedHasNextPage: false,
      },
      {
        name: 'single item dataset',
        page: 1,
        pageSize: 10,
        totalItems: 1,
        expectedItems: 1,
        expectedHasNextPage: false,
      },
    ];

    for (const edgeCase of edgeCases) {
      const { name, page, pageSize, totalItems, expectedItems, expectedHasNextPage } = edgeCase;

      const mockFetcher = vi.fn(async ({ page: p, pageSize: ps }) => {
        const start = (p - 1) * ps;
        const end = Math.min(start + ps, totalItems);

        if (start >= totalItems) {
          return [];
        }

        return Array.from({ length: end - start }, (_, index) => ({
          id: start + index + 1,
          title: `Item ${start + index + 1}`,
          body: `Body ${start + index + 1}`,
          userId: 1,
        }));
      });

      const testQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: Infinity,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () =>
          useListQuery(['edge-case', name], mockFetcher, { page, pageSize }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(
        result.current.data?.length ?? 0,
        `Edge case "${name}": Expected ${expectedItems} items`
      ).toBe(expectedItems);

      expect(
        result.current.hasNextPage,
        `Edge case "${name}": Expected hasNextPage to be ${expectedHasNextPage}`
      ).toBe(expectedHasNextPage);

      testQueryClient.clear();
    }
  });
});
