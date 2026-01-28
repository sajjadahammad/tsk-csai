import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Post } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/use-debounce';

interface PostListWithFiltersProps {
  pageSize?: number;
}

export function PostListWithFilters({ pageSize = 10 }: PostListWithFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedUserId, setSelectedUserId] = useState(searchParams.get('userId') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const params: Record<string, string> = {};
    
    if (debouncedSearch) {
      params.search = debouncedSearch;
    }
    
    if (selectedUserId) {
      params.userId = selectedUserId;
    }
    
    if (currentPage > 1) {
      params.page = currentPage.toString();
    }
    
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedUserId, currentPage, setSearchParams]);

  const { data: allPosts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['posts', 'all'],
    queryFn: async () => {
      const posts = await apiClient.get<Post[]>('/posts');
      return posts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    
    let filtered = [...allPosts];
    
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.body.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedUserId) {
      filtered = filtered.filter((post) => post.userId === Number(selectedUserId));
    }
    
    return filtered;
  }, [allPosts, debouncedSearch, selectedUserId]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPosts.length / pageSize);

  const uniqueUserIds = useMemo(() => {
    if (!allPosts) return [];
    const userIds = new Set(allPosts.map((post) => post.userId));
    return Array.from(userIds).sort((a, b) => a - b);
  }, [allPosts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUserId('');
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-green-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (With Filters)</h2>
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
          <div className="size-1.5 rounded-full bg-green-600" />
          <h2 className="text-xl font-bold tracking-tight">Posts (With Filters)</h2>
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

  const hasActiveFilters = searchQuery || selectedUserId;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-1.5 rounded-full bg-green-600" />
        <h2 className="text-xl font-bold tracking-tight">Posts (With Filters)</h2>
      </div>

      <Card className="border-black/10 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="search" className="text-sm font-medium font-mono">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search posts..."
                  className="w-full px-3 py-2 text-sm font-mono border border-black/10 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="userId" className="text-sm font-medium font-mono">
                  Filter by User
                </label>
                <select
                  id="userId"
                  value={selectedUserId}
                  onChange={handleUserFilterChange}
                  className="w-full px-3 py-2 text-sm font-mono border border-black/10 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                >
                  <option value="">All Users</option>
                  {uniqueUserIds.map((userId) => (
                    <option key={userId} value={userId}>
                      User {userId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-black/10">
                <p className="text-xs text-muted-foreground font-mono">
                  {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} found
                </p>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs border-black/10 hover:bg-black/5"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedPosts.length > 0 ? (
          paginatedPosts.map((post) => (
            <Card key={post.id} className="border-black/10 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="size-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
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
              <p className="text-muted-foreground font-mono text-sm">
                {hasActiveFilters ? 'No posts match your filters.' : 'No posts found.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredPosts.length > pageSize && (
        <div className="flex items-center justify-between border-t border-black/10 pt-6">
          <Button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            variant="outline"
            className="font-mono text-sm border-black/10 hover:bg-black/5"
          >
            ← Previous
          </Button>
          
          <span className="text-sm text-muted-foreground font-mono">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            variant="outline"
            className="font-mono text-sm border-black/10 hover:bg-black/5"
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
