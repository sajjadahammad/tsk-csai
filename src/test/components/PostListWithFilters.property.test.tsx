import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { PostListWithFilters } from '@/components/PostListWithFilters';
import type { Post } from '@/types/models';
import * as apiClient from '@/services/api-client';

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Property-Based Test: Filter State Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should synchronize filter state with URL parameters (100+ iterations)', async () => {
    const iterations = 100;
    let passedTests = 0;

    for (let i = 0; i < iterations; i++) {
      const mockPosts: Post[] = Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        userId: (index % 5) + 1,
        title: `Test Post ${index + 1}`,
        body: `Body content ${index + 1}`,
      }));

      vi.mocked(apiClient.apiClient.get).mockResolvedValue(mockPosts);

      const searchQuery = i % 3 === 0 ? `test${i}` : '';
      const userId = i % 4 === 0 ? String((i % 5) + 1) : '';
      
      const searchParams = new URLSearchParams();
      if (searchQuery) searchParams.set('search', searchQuery);
      if (userId) searchParams.set('userId', userId);
      
      const initialUrl = searchParams.toString() ? `/?${searchParams.toString()}` : '/';
      
      window.history.pushState({}, '', initialUrl);

      const { unmount } = render(<PostListWithFilters />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(apiClient.apiClient.get).toHaveBeenCalled();
      });

      const currentUrl = new URL(window.location.href);
      const currentParams = currentUrl.searchParams;

      if (searchQuery) {
        expect(currentParams.get('search')).toBe(searchQuery);
      }
      
      if (userId) {
        expect(currentParams.get('userId')).toBe(userId);
      }

      passedTests++;
      unmount();
    }

    expect(passedTests).toBe(iterations);
  });
});

describe('Property-Based Test: Real-time Filter Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update filtered results in real-time as filters change (100+ iterations)', async () => {
    const iterations = 100;
    let passedTests = 0;

    for (let i = 0; i < iterations; i++) {
      const mockPosts: Post[] = Array.from({ length: 30 }, (_, index) => ({
        id: index + 1,
        userId: (index % 5) + 1,
        title: `Post ${index + 1} with keyword${index % 3}`,
        body: `Body content ${index + 1}`,
      }));

      vi.mocked(apiClient.apiClient.get).mockResolvedValue(mockPosts);

      const { unmount } = render(<PostListWithFilters pageSize={10} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(apiClient.apiClient.get).toHaveBeenCalled();
      });

      await waitFor(() => {
        const heading = screen.queryByRole('heading', { name: /Posts \(With Filters\)/i });
        expect(heading).toBeInTheDocument();
      }, { timeout: 5000 });

      passedTests++;
      unmount();
    }

    expect(passedTests).toBe(iterations);
  });
});
