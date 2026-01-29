import { z } from 'zod';

// Base schemas
export const AuthorSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string().nullable(),
    avatar_url: z.string().nullable(),
});

export const TagSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.enum(['CATEGORY', 'TOPIC', 'ENTITY']),
    metadata: z.object({
        icon: z.string().optional(),
        badge_bg: z.string().optional(),
        color_hex: z.string().optional(),
    }).nullable().optional(),
});

export const PostImageSchema = z.object({
    id: z.string().uuid(),
    post_id: z.string(),
    image_url: z.string(),
    created_at: z.string(),
});

export const PostSchema = z.object({
    id: z.string(),
    driveId: z.string().nullable().optional(),
    title: z.string(),
    summary: z.string().nullable(),
    key_takeaway: z.string().nullable(),
    sentiment: z.string().nullable(),
    author_id: z.string().uuid().nullable(),
    published_date: z.string().nullable(),
    created_at: z.string(),
    content_raw: z.string().nullable().optional(),
    original_url: z.string().nullable().optional(),
});

// Joined schemas for queries
export const FeedPostSchema = z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    key_takeaway: z.string().nullable(),
    sentiment: z.string().nullable(),
    published_date: z.string().nullable(),
    created_at: z.string(),
    author: AuthorSchema.nullable(),
    cover_image: z.string().nullable(),
    category: TagSchema.nullable(),
});

export const PostDetailSchema = PostSchema.extend({
    author: AuthorSchema.nullable(),
    tags: z.array(TagSchema),
    images: z.array(PostImageSchema),
});

// TypeScript types
export type Author = z.infer<typeof AuthorSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type PostImage = z.infer<typeof PostImageSchema>;
export type Post = z.infer<typeof PostSchema>;
export type FeedPost = z.infer<typeof FeedPostSchema>;
export type PostDetail = z.infer<typeof PostDetailSchema>;

// Query parameter types
export interface FeedQueryParams {
    limit?: number;
    offset?: number;
    categoryId?: string;
    tagId?: string;
    searchQuery?: string;
}

// Card type for rendering
export type CardType = 'image' | 'quote';

export interface InsightCardData extends FeedPost {
    cardType: CardType;
    tags?: Tag[];  // Optional tags for hover display
}

