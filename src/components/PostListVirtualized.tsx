import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Post } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';

export function PostListVirtualized() {
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: posts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: async () => {
      const posts = await apiClient.get<Post[]>('/posts');
      return posts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const rowVirtualizer = useVirtualizer({
    count: posts?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-indigo-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (Virtualized)</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, index) => (
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
          <div className="size-1.5 rounded-full bg-indigo-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (Virtualized)</h2>
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

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-indigo-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (Virtualized)</h2>
        </div>
        
        <div className="text-xs text-muted-foreground font-mono">
          {posts?.length ?? 0} posts • Virtual scrolling enabled
        </div>
      </div>

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border border-black/10 rounded-lg bg-white/50 backdrop-blur-sm"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const post = posts?.[virtualItem.index];
            if (!post) return null;

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-2">
                  <Card className="border-black/10 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="size-1 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                        <CardTitle className="text-base font-semibold leading-tight">{post.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{post.body}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span className="px-2 py-0.5 rounded bg-black/5">User {post.userId}</span>
                        <span className="px-2 py-0.5 rounded bg-black/5">Post #{post.id}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground font-mono text-center">
        Rendering {virtualItems.length} of {posts?.length ?? 0} items
      </div>
    </div>
  );
}
