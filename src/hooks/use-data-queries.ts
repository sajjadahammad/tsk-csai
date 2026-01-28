import {
  useQuery,
  useMutation as useReactQueryMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';

export interface UseListQueryOptions<T> {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  queryOptions?: Omit<UseQueryOptions<T[], Error>, 'queryKey' | 'queryFn'>;
}

export interface UseListQueryResult<T> {
  data: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetching: boolean;
}

interface PaginationParams {
  page: number;
  pageSize: number;
}

export function useListQuery<T>(
  queryKey: QueryKey,
  fetcher: (params: PaginationParams) => Promise<T[]>,
  options?: UseListQueryOptions<T>
): UseListQueryResult<T> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const enabled = options?.enabled ?? true;

  const fullQueryKey = [...(Array.isArray(queryKey) ? queryKey : [queryKey]), { page, pageSize }];

  const query = useQuery<T[], Error>({
    queryKey: fullQueryKey,
    queryFn: () => fetcher({ page, pageSize }),
    enabled,
    ...options?.queryOptions,
  });

  const hasNextPage = query.data ? query.data.length === pageSize : false;

  const fetchNextPage = () => {
    if (hasNextPage && !query.isFetching) {
      query.refetch();
    }
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage,
    fetchNextPage,
    isFetching: query.isFetching,
  };
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  data: TData | undefined;
  reset: () => void;
}

export interface UseMutationHookOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  invalidateQueries?: QueryKey[];
  optimisticUpdate?: {
    queryKey: QueryKey;
    updater: (oldData: any, variables: TVariables) => any;
  };
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationHookOptions<TData, TVariables>
): UseMutationResult<TData, TVariables> {
  const queryClient = useQueryClient();

  const mutationOptions: UseMutationOptions<TData, Error, TVariables> = {
    mutationFn,
    onMutate: async (variables: TVariables) => {
      if (options?.optimisticUpdate) {
        const { queryKey, updater } = options.optimisticUpdate;

        await queryClient.cancelQueries({ queryKey });

        const previousData = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (oldData: any) => {
          return updater(oldData, variables);
        });

        return { previousData, queryKey };
      }
    },
    onSuccess: (data: TData, variables: TVariables) => {
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    onError: (error: Error, variables: TVariables, context: any) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }

      if (options?.onError) {
        options.onError(error, variables);
      }
    },
    onSettled: (data: TData | undefined, error: Error | null, variables: TVariables) => {
      if (options?.onSettled) {
        options.onSettled(data, error, variables);
      }
    },
  };

  const mutation = useReactQueryMutation<TData, Error, TVariables>(mutationOptions);

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
