import { useQuery } from '@tanstack/react-query';
import { getFeedPostsOptimized } from './queries-optimized';
import type { FeedQueryParams } from './types';

/**
 * React Query hook for optimized feed posts
 * This uses a single query with JOINs instead of N+1 pattern
 * 
 * Performance: 1 query vs 61+ queries (old version)
 */
export function useFeedPostsOptimized(params: FeedQueryParams = {}) {
    return useQuery({
        queryKey: ['feed-posts-optimized', params],
        queryFn: () => getFeedPostsOptimized(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
