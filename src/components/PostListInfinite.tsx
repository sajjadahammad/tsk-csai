import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Post } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';

interface PostListInfiniteProps {
  pageSize?: number;
}

export function PostListInfinite({ pageSize = 10 }: PostListInfiniteProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const posts = await apiClient.get<Post[]>('/posts', {
        params: {
          _page: pageParam,
          _limit: pageSize,
        },
      });
      return {
        posts,
        nextPage: posts.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-purple-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (Infinite Scroll)</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: pageSize }).map((_, index) => (
            <Card key={index} className="border-black/10 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <Skeleton width="60%" height={24} />
              </CardHeader>
              <CardContent>
                <Skeleton width="100%" height={48} className="mb-2" />
                <Skeleton width="30%" height={16} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-purple-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (Infinite Scroll)</h2>
        </div>
        <Card className="border-red-500/50 bg-red-50/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-red-700 text-lg">Error Loading Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-600 font-mono">
              {(error as Error)?.message || 'An error occurred while loading posts. Please try again.'}
            </p>
            <Button 
              onClick={handleRetry} 
              variant="outline"
              className="border-red-500/50 hover:bg-red-50 font-mono text-sm"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-purple-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (Infinite Scroll)</h2>
        </div>
        
        <div className="text-xs text-muted-foreground font-mono">
          {allPosts.length} posts loaded
        </div>
      </div>

      <div className="space-y-4">
        {allPosts.length > 0 ? (
          <>
            {allPosts.map((post) => (
              <Card key={post.id} className="border-black/10 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="size-1 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <CardTitle className="text-base font-semibold leading-tight">{post.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{post.body}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/5">User {post.userId}</span>
                    <span className="px-2 py-0.5 rounded bg-black/5">Post #{post.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div ref={observerTarget} className="py-8">
              {isFetchingNextPage && (
                <div className="flex flex-col items-center gap-4">
                  <div className="size-8 animate-spin rounded-full border-4 border-purple-600 border-r-transparent" />
                  <p className="text-sm text-muted-foreground font-mono">Loading more posts...</p>
                </div>
              )}
              
              {!hasNextPage && allPosts.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-mono">
                    You've reached the end! 🎉
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <Card className="border-black/10 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground font-mono text-sm">No posts found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
