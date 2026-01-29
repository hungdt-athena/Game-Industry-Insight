-- Performance Optimization: Add Indexes

-- Index for post_images lookups (used in EVERY post card render)
create index if not exists idx_post_images_post_id on public.post_images(post_id);
create index if not exists idx_post_images_created_at on public.post_images(created_at);

-- Index for post_tags lookups (used in EVERY post card render)
create index if not exists idx_post_tags_post_id on public.post_tags(post_id);
create index if not exists idx_post_tags_tag_id on public.post_tags(tag_id);

-- Index for posts queries
create index if not exists idx_posts_published_date on public.posts(published_date desc);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

-- Index for tags filtering
create index if not exists idx_tags_type on public.tags(type);
create index if not exists idx_tags_name on public.tags(name);

-- Composite index for common queries
create index if not exists idx_post_tags_composite on public.post_tags(post_id, tag_id);

-- ANALYZE tables for query planner
analyze public.posts;
analyze public.post_images;
analyze public.post_tags;
analyze public.tags;
analyze public.authors;
