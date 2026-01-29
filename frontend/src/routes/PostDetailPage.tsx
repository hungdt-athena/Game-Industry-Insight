import { Link, useParams } from 'wouter';
import { useState } from 'react';
import {
    ArrowLeft,
    Heart,
    Bookmark,
    Clock,
    ExternalLink,
    X,
} from 'lucide-react';
import { usePostDetail, useRelatedPostsByCategory, useRandomPosts } from '@/lib/queries';
import { TagChip } from '@/components/TagChip';
import { RelatedPostsSection } from '@/components/RelatedPosts';
import { PostDetailSkeleton } from '@/components/Skeletons';
import { getCategoryColorByName, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';
import { formatContentRaw } from '@/lib/textUtils';

export function PostDetailPage() {
    const params = useParams<{ id: string }>();
    const { data: post, isLoading, error } = usePostDetail(params.id);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Extract category for related posts query (safe even if post is null)
    const categoryId = post?.tags?.find(t => t.type === 'CATEGORY')?.id;

    // Related posts hooks - called unconditionally at top level
    const { data: relatedByCategory, isLoading: relatedByCategoryLoading } = useRelatedPostsByCategory(
        categoryId,
        params.id,
        4
    );
    const { data: randomPosts, isLoading: randomPostsLoading } = useRandomPosts(params.id, 4);


    if (isLoading) {
        return <PostDetailSkeleton />;
    }

    if (error || !post) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">😕</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    Post not found
                </h2>
                <p className="text-slate-500 mb-6">
                    The insight you're looking for doesn't exist or has been removed.
                </p>
                <Link href="/">
                    <button className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                        Back to Gallery
                    </button>
                </Link>
            </div>
        );
    }

    const categoryTags = post.tags.filter((t) => t.type === 'CATEGORY');
    const topicTags = post.tags.filter((t) => t.type !== 'CATEGORY');

    // Get category color config
    const categoryColorConfig = categoryTags[0]
        ? getCategoryColorByName(categoryTags[0].name) || DEFAULT_CATEGORY_COLOR
        : DEFAULT_CATEGORY_COLOR;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <Link href="/">
                    <span className="hover:text-primary-600 cursor-pointer">Library</span>
                </Link>
                <span>/</span>
                {categoryTags[0] && (
                    <>
                        <Link href={`/category/${categoryTags[0].id}`}>
                            <span className="hover:text-primary-600 cursor-pointer">
                                {categoryTags[0].name}
                            </span>
                        </Link>
                        <span>/</span>
                    </>
                )}
                <span className="text-slate-700 truncate max-w-[200px]">{post.title}</span>
            </nav>

            {/* Main Content */}
            <article className="bg-white rounded-2xl shadow-card overflow-hidden">
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-slate-100">
                    {/* Category Tags with color */}
                    {categoryTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {categoryTags.map((tag) => {
                                const colorConfig = getCategoryColorByName(tag.name) || DEFAULT_CATEGORY_COLOR;
                                return (
                                    <TagChip
                                        key={tag.id}
                                        name={tag.name}
                                        type={tag.type}
                                        size="sm"
                                        categoryColorConfig={colorConfig}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Title - Larger */}
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        {post.title}
                    </h1>

                    {/* Published Date + Read Time */}
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                        {post.published_date && (
                            <span>
                                {new Date(post.published_date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>6 min read</span>
                        </span>
                    </div>

                    {/* Summary */}
                    {post.summary && (
                        <p className="text-slate-600 leading-relaxed">{post.summary}</p>
                    )}

                    {/* Author Section */}
                    {post.author && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                {post.author.avatar_url ? (
                                    <img
                                        src={post.author.avatar_url}
                                        alt={post.author.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                        <span className="text-white font-medium">
                                            {post.author.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <div className="font-medium text-slate-900">
                                        {post.author.name}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        Research Analyst
                                    </div>
                                </div>
                            </div>
                            <button className="px-4 py-1.5 border border-primary-500 text-primary-600 text-sm font-medium rounded-full hover:bg-primary-50 transition-colors">
                                + Follow
                            </button>
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                            <span className="text-sm">Like</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-slate-500 hover:text-yellow-600 transition-colors">
                            <Bookmark className="w-5 h-5" />
                            <span className="text-sm">Save</span>
                        </button>
                    </div>
                    {/* Original article button */}
                    {post.original_url && (
                        <a
                            href={post.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Original</span>
                        </a>
                    )}
                </div>

                {/* Key Takeaway - with category color */}
                {post.key_takeaway && (
                    <div
                        className="p-6 md:p-8 border-b border-slate-100"
                        style={{ backgroundColor: categoryColorConfig.colorHex + '15' }}
                    >
                        <div
                            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3"
                            style={{ color: categoryColorConfig.colorHex }}
                        >
                            Key Takeaway
                        </div>
                        <blockquote
                            className="text-lg md:text-xl font-medium italic leading-relaxed"
                            style={{ color: categoryColorConfig.colorHex }}
                        >
                            "{post.key_takeaway}"
                        </blockquote>
                    </div>
                )}

                {/* Content Body */}
                <div className="p-6 md:p-8 prose prose-slate max-w-none">
                    {/* Render content_raw if available */}
                    {post.content_raw ? (
                        <div dangerouslySetInnerHTML={{ __html: formatContentRaw(post.content_raw) }} />
                    ) : (
                        <>
                            <h2>The Shift to Dynamic Interfaces</h2>
                            <p>
                                Traditional UI design relies on static artifacts - Figma files, mockups, and redlines - that
                                developers translate into code. However, as Large Language Models (LLMs) become more
                                capable of understanding context and intent, we are witnessing the emergence of "Generative
                                UI." This paradigm allows interfaces to be constructed in real-time based on the user's specific
                                needs, device constraints, and current task.
                            </p>
                            <p>
                                Instead of designing every possible state, designers will soon define the{' '}
                                <strong>rules of engagement</strong> and the <em>visual language system</em> that the AI uses
                                to assemble the interface. This isn't just about efficiency; it's about relevance.
                            </p>

                            <h2>Constraint-Based Design</h2>
                            <p>
                                The role of the designer evolves into that of a curator and system architect. We define the
                                constraints—brand colors, typographic scales, spacing rules—and the AI operates within those
                                boundaries. This ensures consistency while allowing for infinite flexibility.
                            </p>
                        </>
                    )}
                </div>

                {/* Image Gallery - Centered, bigger, at the end */}
                {post.images && post.images.length > 0 && (
                    <div className="px-6 md:px-8 pb-8">
                        <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
                            {post.images.map((image) => (
                                <img
                                    key={image.id}
                                    src={image.image_url}
                                    alt="Post image"
                                    className="rounded-xl w-full cursor-zoom-in hover:opacity-90 transition-opacity shadow-lg"
                                    onClick={() => setLightboxImage(image.image_url)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Topic Tags */}
                {topicTags.length > 0 && (
                    <div className="px-6 md:px-8 pb-6 border-t border-slate-100 pt-6">
                        <div className="flex flex-wrap gap-2">
                            {topicTags.map((tag) => (
                                <TagChip key={tag.id} id={tag.id} name={`#${tag.name}`} type={tag.type} size="md" />
                            ))}
                        </div>
                    </div>
                )}
            </article>

            {/* Back Button */}
            <div className="mt-6">
                <Link href="/">
                    <button className="flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Gallery</span>
                    </button>
                </Link>
            </div>

            {/* Related Posts Sections */}
            <div className="mt-12 space-y-10">
                {/* Related by Category */}
                <RelatedPostsSection
                    title="Related posts by Category"
                    posts={relatedByCategory || []}
                    isLoading={relatedByCategoryLoading}
                />

                {/* Related by Content (Random for now) */}
                <RelatedPostsSection
                    title="Related posts by Content"
                    posts={randomPosts || []}
                    isLoading={randomPostsLoading}
                />
            </div>

            {/* Lightbox Modal */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setLightboxImage(null)}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                        onClick={() => setLightboxImage(null)}
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    {/* Image */}
                    <img
                        src={lightboxImage}
                        alt="Fullscreen view"
                        className="max-w-full max-h-full object-contain animate-zoomIn"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

export default PostDetailPage;
