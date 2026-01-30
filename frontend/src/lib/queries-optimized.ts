import { supabase } from './supabase';
import type { InsightCardData, FeedQueryParams, Tag, Author } from './types';

// OPTIMIZED VERSION - Single query with all JOINs
export async function getFeedPostsOptimized(params: FeedQueryParams = {}): Promise<InsightCardData[]> {
    const { categoryId, tagId, limit = 30, offset = 0 } = params;

    let postIds: string[] | undefined;

    // Pre-filter by category or tag
    if (categoryId || tagId) {
        const { data: postTags } = await supabase
            .from('post_tags')
            .select('post_id')
            .eq('tag_id', categoryId || tagId);

        postIds = postTags?.map(pt => pt.post_id) || [];

        if (postIds.length === 0) return [];
    }

    // ⭐ SINGLE QUERY with all joins - Much faster!
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
            ),
            post_images (
                image_url
            ),
            post_tags!inner (
                tags:tag_id (
                    id,
                    name,
                    type,
                    slug
                )
            ),
            post_likes (id),
            user_saved_posts (id)
        `)
        .order('created_at', { ascending: false });

    if (postIds) {
        query = query.in('id', postIds);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }

    // Transform data
    return (posts || []).map((post: any) => {
        const author: Author | null = post.authors ? {
            id: post.authors.id,
            name: post.authors.name,
            slug: post.authors.slug || null,
            avatar_url: post.authors.avatar_url || null
        } : null;

        const coverImage = post.post_images?.[0]?.image_url || null;
        const cardType = coverImage ? 'image' : 'quote';

        // Extract category and tags
        let categoryTag: Tag | null = null;
        const allTags: Tag[] = [];

        if (post.post_tags) {
            for (const pt of post.post_tags) {
                if (pt.tags) {
                    const tag: Tag = {
                        id: pt.tags.id,
                        name: pt.tags.name,
                        type: pt.tags.type,
                        slug: pt.tags.slug
                    };

                    if (tag.type === 'CATEGORY' && !categoryTag) {
                        categoryTag = tag;
                    } else if (tag.type !== 'CATEGORY') {
                        allTags.push(tag);
                    }
                }
            }
        }

        return {
            id: post.id,
            title: post.title,
            summary: post.summary,
            key_takeaway: post.key_takeaway,
            sentiment: post.sentiment,
            published_date: post.published_date,
            created_at: post.created_at,
            author,
            cover_image: coverImage,
            category: categoryTag,
            cardType,
            tags: allTags,
            likes_count: post.post_likes?.length || 0,
            saves_count: post.user_saved_posts?.length || 0,
        };
    });
}
