import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { FeedPost, Tag, PostDetail, FeedQueryParams, InsightCardData, PostImage } from './types';

// Helper to safely extract author from Supabase response
function extractAuthor(authors: unknown): FeedPost['author'] {
    if (!authors || typeof authors !== 'object') return null;
    const a = authors as Record<string, unknown>;
    if (Array.isArray(a)) {
        const first = a[0];
        if (!first) return null;
        return {
            id: String(first.id || ''),
            name: String(first.name || ''),
            slug: first.slug ? String(first.slug) : null,
            avatar_url: first.avatar_url ? String(first.avatar_url) : null,
        };
    }
    return {
        id: String(a.id || ''),
        name: String(a.name || ''),
        slug: a.slug ? String(a.slug) : null,
        avatar_url: a.avatar_url ? String(a.avatar_url) : null,
    };
}

// Helper to safely extract tag from Supabase response
function extractTag(tags: unknown): Tag | null {
    if (!tags || typeof tags !== 'object') return null;
    const t = tags as Record<string, unknown>;
    if (Array.isArray(t)) {
        const first = t[0];
        if (!first) return null;
        const type = String(first.type || 'TOPIC');
        if (type !== 'CATEGORY' && type !== 'TOPIC' && type !== 'ENTITY') return null;
        return {
            id: String(first.id || ''),
            name: String(first.name || ''),
            type: type as 'CATEGORY' | 'TOPIC' | 'ENTITY',
        };
    }
    const type = String(t.type || 'TOPIC');
    if (type !== 'CATEGORY' && type !== 'TOPIC' && type !== 'ENTITY') return null;
    return {
        id: String(t.id || ''),
        name: String(t.name || ''),
        type: type as 'CATEGORY' | 'TOPIC' | 'ENTITY',
    };
}

// Fetch feed posts with author, cover image, and category
export async function getFeedPosts(params: FeedQueryParams = {}): Promise<InsightCardData[]> {
    const { limit = 30, offset = 0, categoryId, tagId } = params;

    // Filter by tag (categoryId or tagId - they both reference tags table)
    const filterTagId = categoryId || tagId;
    let postIds: string[] | null = null;

    if (filterTagId) {
        // Get post IDs that have the specified tag
        const { data: postTags, error: tagError } = await supabase
            .from('post_tags')
            .select('post_id')
            .eq('tag_id', filterTagId);

        if (tagError) {
            console.error('Error fetching post tags:', tagError);
            throw tagError;
        }

        postIds = postTags?.map(pt => pt.post_id) || [];

        // If no posts have this tag, return early
        if (postIds.length === 0) {
            return [];
        }
    }

    // Build the query
    let query = supabase
        .from('posts')
        .select(`
      id,
      title,
      summary,
      key_takeaway,
      sentiment,
      published_date,
      created_at,
      authors:author_id (
        id,
        name,
        slug,
        avatar_url
      )
    `)
        .order('created_at', { ascending: false });

    // Apply category filter if we have post IDs
    if (postIds) {
        query = query.in('id', postIds);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }

    // For each post, get cover image and category
    const enrichedPosts: InsightCardData[] = await Promise.all(
        (posts || []).map(async (post) => {
            // Get first image
            const { data: images } = await supabase
                .from('post_images')
                .select('image_url')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true })
                .limit(1);

            // Get category tag
            const { data: postTags } = await supabase
                .from('post_tags')
                .select(`
          tags:tag_id (
            id,
            name,
            type
          )
        `)
                .eq('post_id', post.id);

            // Find category tag
            let categoryTag: Tag | null = null;
            if (postTags) {
                for (const pt of postTags) {
                    const tag = extractTag(pt.tags);
                    if (tag && tag.type === 'CATEGORY') {
                        categoryTag = tag;
                        break;
                    }
                }
            }

            // Extract all topic/entity tags (non-category)
            const allTags: Tag[] = [];
            if (postTags) {
                for (const pt of postTags) {
                    const tag = extractTag(pt.tags);
                    if (tag && tag.type !== 'CATEGORY') {
                        allTags.push(tag);
                    }
                }
            }

            const coverImage = images?.[0]?.image_url || null;
            const cardType = coverImage ? 'image' : 'quote';

            return {
                id: post.id,
                title: post.title,
                summary: post.summary,
                key_takeaway: post.key_takeaway,
                sentiment: post.sentiment,
                published_date: post.published_date,
                created_at: post.created_at,
                author: extractAuthor(post.authors),
                cover_image: coverImage,
                category: categoryTag,
                cardType,
                tags: allTags,
            };
        })
    );

    return enrichedPosts;
}

// Fetch single post by ID with all relations
export async function getPostById(id: string): Promise<PostDetail | null> {
    const { data: post, error } = await supabase
        .from('posts')
        .select(`
      *,
      authors:author_id (
        id,
        name,
        slug,
        avatar_url
      )
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching post:', error);
        return null;
    }

    // Get all tags
    const { data: postTags } = await supabase
        .from('post_tags')
        .select(`
      tags:tag_id (
        id,
        name,
        type
      )
    `)
        .eq('post_id', id);

    // Get all images
    const { data: images } = await supabase
        .from('post_images')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

    // Extract tags
    const tags: Tag[] = [];
    if (postTags) {
        for (const pt of postTags) {
            const tag = extractTag(pt.tags);
            if (tag) {
                tags.push(tag);
            }
        }
    }

    return {
        ...post,
        author: extractAuthor(post.authors),
        tags,
        images: (images || []) as PostImage[],
    };
}

// Fetch categories (tags with type CATEGORY)
export async function getCategories(): Promise<Tag[]> {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('type', 'CATEGORY')
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }

    return (data || []) as Tag[];
}

// Fetch trending tags (TOPIC/ENTITY types)
// Note: For MVP, we're just fetching recent tags. Frequency-based ordering would require a more complex query.
export async function getTrendingTags(): Promise<Tag[]> {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .in('type', ['TOPIC', 'ENTITY'])
        .limit(20);

    if (error) {
        console.error('Error fetching trending tags:', error);
        throw error;
    }

    return (data || []) as Tag[];
}

// React Query Hooks
export function useFeedPosts(params: FeedQueryParams = {}) {
    return useQuery({
        queryKey: ['feedPosts', params],
        queryFn: () => getFeedPosts(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function usePostDetail(id: string | undefined) {
    return useQuery({
        queryKey: ['post', id],
        queryFn: () => getPostById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

export function useTrendingTags() {
    return useQuery({
        queryKey: ['trendingTags'],
        queryFn: getTrendingTags,
        staleTime: 15 * 60 * 1000, // 15 minutes
    });
}

// Fetch related posts by category (excluding current post)
export async function getRelatedPostsByCategory(
    categoryId: string,
    excludePostId: string,
    limit: number = 4
): Promise<InsightCardData[]> {
    // Get post IDs with this category
    const { data: postTags, error: tagError } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tag_id', categoryId);

    if (tagError) {
        console.error('Error fetching related post tags:', tagError);
        throw tagError;
    }

    const postIds = (postTags?.map(pt => pt.post_id) || []).filter(id => id !== excludePostId);

    if (postIds.length === 0) {
        return [];
    }

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
      id,
      title,
      summary,
      key_takeaway,
      sentiment,
      published_date,
      created_at,
      authors:author_id (
        id,
        name,
        slug,
        avatar_url
      )
    `)
        .in('id', postIds)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching related posts:', error);
        throw error;
    }

    // Enrich with cover image and category
    const enrichedPosts: InsightCardData[] = await Promise.all(
        (posts || []).map(async (post) => {
            const { data: images } = await supabase
                .from('post_images')
                .select('image_url')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true })
                .limit(1);

            // Get category tag
            const { data: postTags } = await supabase
                .from('post_tags')
                .select(`
          tags:tag_id (
            id,
            name,
            type
          )
        `)
                .eq('post_id', post.id);

            // Find category tag
            let categoryTag: Tag | null = null;
            if (postTags) {
                for (const pt of postTags) {
                    const tag = extractTag(pt.tags);
                    if (tag && tag.type === 'CATEGORY') {
                        categoryTag = tag;
                        break;
                    }
                }
            }

            const coverImage = images?.[0]?.image_url || null;

            return {
                id: post.id,
                title: post.title,
                summary: post.summary,
                key_takeaway: post.key_takeaway,
                sentiment: post.sentiment,
                published_date: post.published_date,
                created_at: post.created_at,
                author: extractAuthor(post.authors),
                cover_image: coverImage,
                category: categoryTag,
                cardType: coverImage ? 'image' : 'quote',
            };
        })
    );

    return enrichedPosts;
}

// Fetch random posts (excluding current post)
export async function getRandomPosts(
    excludePostId: string,
    limit: number = 4
): Promise<InsightCardData[]> {
    // Supabase doesn't have built-in random, so we fetch more and shuffle
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
      id,
      title,
      summary,
      key_takeaway,
      sentiment,
      published_date,
      created_at,
      authors:author_id (
        id,
        name,
        slug,
        avatar_url
      )
    `)
        .neq('id', excludePostId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching random posts:', error);
        throw error;
    }

    // Shuffle and take first 'limit' posts
    const shuffled = (posts || []).sort(() => Math.random() - 0.5).slice(0, limit);

    // Enrich with cover image and category
    const enrichedPosts: InsightCardData[] = await Promise.all(
        shuffled.map(async (post) => {
            const { data: images } = await supabase
                .from('post_images')
                .select('image_url')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true })
                .limit(1);

            // Get category tag
            const { data: postTags } = await supabase
                .from('post_tags')
                .select(`
          tags:tag_id (
            id,
            name,
            type
          )
        `)
                .eq('post_id', post.id);

            // Find category tag
            let categoryTag: Tag | null = null;
            if (postTags) {
                for (const pt of postTags) {
                    const tag = extractTag(pt.tags);
                    if (tag && tag.type === 'CATEGORY') {
                        categoryTag = tag;
                        break;
                    }
                }
            }

            const coverImage = images?.[0]?.image_url || null;

            return {
                id: post.id,
                title: post.title,
                summary: post.summary,
                key_takeaway: post.key_takeaway,
                sentiment: post.sentiment,
                published_date: post.published_date,
                created_at: post.created_at,
                author: extractAuthor(post.authors),
                cover_image: coverImage,
                category: categoryTag,
                cardType: coverImage ? 'image' : 'quote',
            };
        })
    );

    return enrichedPosts;
}

// React Query hook for related posts by category
export function useRelatedPostsByCategory(
    categoryId: string | undefined,
    excludePostId: string | undefined,
    limit: number = 4
) {
    return useQuery({
        queryKey: ['relatedByCategory', categoryId, excludePostId, limit],
        queryFn: () => getRelatedPostsByCategory(categoryId!, excludePostId!, limit),
        enabled: !!categoryId && !!excludePostId,
        staleTime: 5 * 60 * 1000,
    });
}

// React Query hook for random posts
export function useRandomPosts(excludePostId: string | undefined, limit: number = 4) {
    return useQuery({
        queryKey: ['randomPosts', excludePostId, limit],
        queryFn: () => getRandomPosts(excludePostId!, limit),
        enabled: !!excludePostId,
        staleTime: 5 * 60 * 1000,
    });
}

