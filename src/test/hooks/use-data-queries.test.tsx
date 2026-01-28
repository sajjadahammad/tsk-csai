import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useListQuery, useMutation } from '../../hooks/use-data-queries';
import type { ReactNode } from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useListQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose loading state while fetching', async () => {
    const fetcher = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([{ id: 1 }]), 100))
    );

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('should expose error state when fetching fails', async () => {
    const error = new Error('Fetch failed');
    const fetcher = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should cache data when fetching succeeds', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const fetcher = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(data);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should support pagination with page and pageSize', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher, { page: 2, pageSize: 20 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledWith({ page: 2, pageSize: 20 });
  });

  it('should indicate hasNextPage when data length equals pageSize', async () => {
    const pageSize = 10;
    const data = Array.from({ length: pageSize }, (_, i) => ({ id: i }));
    const fetcher = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher, { pageSize }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it('should indicate no next page when data length is less than pageSize', async () => {
    const pageSize = 10;
    const data = [{ id: 1 }, { id: 2 }];
    const fetcher = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher, { pageSize }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it('should support manual refetch', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    result.current.refetch();

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  it('should respect enabled option', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher, { enabled: false }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 500 });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('should use default page and pageSize when not provided', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(
      () => useListQuery(['test'], fetcher),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  });
});

describe('useMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose loading state during mutation', async () => {
    const mutationFn = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 100))
    );

    const { result } = renderHook(
      () => useMutation(mutationFn),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);

    result.current.mutate({ name: 'test' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should expose error state when mutation fails', async () => {
    const error = new Error('Mutation failed');
    const mutationFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () => useMutation(mutationFn),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ name: 'test' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should expose success state when mutation succeeds', async () => {
    const data = { id: 1, name: 'test' };
    const mutationFn = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(
      () => useMutation(mutationFn),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ name: 'test' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(data);
  });

  it('should call onSuccess callback when mutation succeeds', async () => {
    const data = { id: 1, name: 'test' };
    const mutationFn = vi.fn().mockResolvedValue(data);
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useMutation(mutationFn, { onSuccess }),
      { wrapper: createWrapper() }
    );

    const variables = { name: 'test' };
    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(data, variables);
  });

  it('should call onError callback when mutation fails', async () => {
    const error = new Error('Mutation failed');
    const mutationFn = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(
      () => useMutation(mutationFn, { onError }),
      { wrapper: createWrapper() }
    );

    const variables = { name: 'test' };
    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledWith(error, variables);
  });

  it('should call onSettled callback after mutation completes', async () => {
    const data = { id: 1, name: 'test' };
    const mutationFn = vi.fn().mockResolvedValue(data);
    const onSettled = vi.fn();

    const { result } = renderHook(
      () => useMutation(mutationFn, { onSettled }),
      { wrapper: createWrapper() }
    );

    const variables = { name: 'test' };
    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSettled).toHaveBeenCalledWith(data, null, variables);
  });

  it('should invalidate queries on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    queryClient.setQueryData(['test'], [{ id: 1 }]);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const mutationFn = vi.fn().mockResolvedValue({ id: 2 });

    const { result } = renderHook(
      () => useMutation(mutationFn, { invalidateQueries: [['test']] }),
      { wrapper }
    );

    result.current.mutate({ name: 'test' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['test'] });
  });

  it('should support optimistic updates', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialData = [{ id: 1, name: 'Item 1' }];
    queryClient.setQueryData(['items'], initialData);

    const mutationFn = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 2, name: 'Item 2' }), 100))
    );

    const { result } = renderHook(
      () =>
        useMutation(mutationFn, {
          optimisticUpdate: {
            queryKey: ['items'],
            updater: (oldData: any[], variables: any) => [...oldData, variables],
          },
        }),
      { wrapper }
    );

    const newItem = { id: 2, name: 'Item 2' };
    result.current.mutate(newItem);

    await waitFor(() => {
      const data = queryClient.getQueryData(['items']);
      expect(data).toEqual([...initialData, newItem]);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should revert optimistic update on error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialData = [{ id: 1, name: 'Item 1' }];
    queryClient.setQueryData(['items'], initialData);

    const error = new Error('Mutation failed');
    const mutationFn = vi.fn().mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(error), 50))
    );

    const { result } = renderHook(
      () =>
        useMutation(mutationFn, {
          optimisticUpdate: {
            queryKey: ['items'],
            updater: (oldData: any[], variables: any) => [...oldData, variables],
          },
        }),
      { wrapper }
    );

    const newItem = { id: 2, name: 'Item 2' };
    result.current.mutate(newItem);

    await waitFor(() => {
      const data = queryClient.getQueryData(['items']);
      expect(data).toEqual([...initialData, newItem]);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    await waitFor(() => {
      const finalData = queryClient.getQueryData(['items']);
      expect(finalData).toEqual(initialData);
    });
  });

  it('should support mutateAsync for promise-based usage', async () => {
    const data = { id: 1, name: 'test' };
    const mutationFn = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(
      () => useMutation(mutationFn),
      { wrapper: createWrapper() }
    );

    const promise = result.current.mutateAsync({ name: 'test' });

    await expect(promise).resolves.toEqual(data);
  });

  it('should support reset to clear mutation state', async () => {
    const data = { id: 1, name: 'test' };
    const mutationFn = vi.fn().mockResolvedValue(data);

    const { result } = renderHook(
      () => useMutation(mutationFn),
      { wrapper: createWrapper() }
    );

    result.current.mutate({ name: 'test' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(data);

    result.current.reset();

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });
  });
});
