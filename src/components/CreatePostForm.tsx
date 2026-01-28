import React, { useState } from 'react';
import { useMutation } from '@/hooks/use-data-queries';
import { apiClient } from '@/services/api-client';
import type { Post } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function CreatePostForm() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    // We assume the list is on page 1 with pageSize 10 for optimistic updates
    const listQueryKey = ['posts', { page: 1, pageSize: 10 }];

    const { mutate, isLoading, isError, error } = useMutation<Post, Partial<Post>>(
        async (newPost) => {
            // API call
            return await apiClient.post<Post>('/posts', newPost);
        },
        {
            optimisticUpdate: {
                queryKey: listQueryKey,
                updater: (oldData: Post[] | undefined, newPost) => {
                    const tempPost: Post = {
                        id: Date.now(), // Temporary ID
                        userId: 1, // Mock user ID
                        title: newPost.title || '',
                        body: newPost.body || '',
                    };
                    return [tempPost, ...(oldData || [])];
                },
            },
            onSuccess: () => {
                setTitle('');
                setBody('');
                setValidationError(null);
            },
            invalidateQueries: [['posts']], // Invalidate all post lists to be safe
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !body.trim()) {
            setValidationError('Title and body are required.');
            return;
        }

        setValidationError(null);
        mutate({ title, body, userId: 1 });
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Post title"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="body" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Content
                        </label>
                        <textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Post content"
                            disabled={isLoading}
                        />
                    </div>

                    {validationError && (
                        <p className="text-sm font-medium text-destructive text-red-500">{validationError}</p>
                    )}

                    {isError && (
                        <p className="text-sm font-medium text-destructive text-red-500">
                            {error?.message || 'Failed to create post. Please try again.'}
                        </p>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Creating...' : 'Create Post'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
