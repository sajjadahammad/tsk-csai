import { useState } from 'react';
import { useListQuery } from '@/hooks/use-data-queries';
import { apiClient } from '@/services/api-client';
import type { Post } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';

interface PostListProps {
  pageSize?: number;
}

export function PostList({ pageSize = 10 }: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useListQuery<Post>(
    ['posts'],
    async ({ page, pageSize: size }) => {
      const posts = await apiClient.get<Post[]>('/posts', {
        params: {
          _page: page,
          _limit: size,
        },
      });
      return posts;
    },
    {
      page: currentPage,
      pageSize,
    }
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-blue-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts</h2>
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
          <div className="size-1.5 rounded-full bg-blue-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts</h2>
        </div>
        <Card className="border-red-500/50 bg-red-50/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-red-700 text-lg">Error Loading Posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-600 font-mono">
              {error?.message || 'An error occurred while loading posts. Please try again.'}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-blue-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts</h2>
        </div>
        
        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <div className="size-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.map((post) => (
            <Card key={post.id} className="border-black/10 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="size-1 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
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
          ))
        ) : (
          <Card className="border-black/10 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground font-mono text-sm">No posts found.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-black/10 pt-6">
        <Button
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || isFetching}
          variant="outline"
          className="font-mono text-sm border-black/10 hover:bg-black/5"
        >
          ← Previous
        </Button>
        
        <span className="text-sm text-muted-foreground font-mono">
          Page {currentPage}
        </span>
        
        <Button
          onClick={handleNextPage}
          disabled={!data || data.length < pageSize || isFetching}
          variant="outline"
          className="font-mono text-sm border-black/10 hover:bg-black/5"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
