import { Link, useParams } from 'wouter';
import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Heart,
    Bookmark,
    Clock,
    ExternalLink,
    X,
    UserPlus,
    UserMinus,
    Loader2,
} from 'lucide-react';
import { usePostDetail, useRelatedPostsByCategory, useRandomPosts } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import {
    isPostLiked,
    likePost,
    unlikePost,
    getPostLikeCount,
    isPostSaved,
    savePost,
    unsavePost,
    isFollowingAuthor,
    followAuthor,
    unfollowAuthor,
} from '@/lib/queries-auth';
import { TagChip } from '@/components/TagChip';
import { RelatedPostsSection } from '@/components/RelatedPosts';
import { PostDetailSkeleton } from '@/components/Skeletons';
import { getCategoryColorByName, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';
import { formatContentRaw } from '@/lib/textUtils';
import { savedPostsEvents, postUpdateEvents } from '@/lib/savedPostsEvents';

export function PostDetailPage() {
    const params = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const { data: post, isLoading, error } = usePostDetail(params.id);
    const { user, isAuthenticated } = useAuth();
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Interaction states
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    // Load interaction states when authenticated
    useEffect(() => {
        if (!isAuthenticated || !user || !params.id) return;

        const loadInteractionStates = async () => {
            try {
                const [isLiked, isSaved, likeCountResult] = await Promise.all([
                    isPostLiked(user.id, params.id!),
                    isPostSaved(user.id, params.id!),
                    getPostLikeCount(params.id!),
                ]);
                setLiked(isLiked);
                setSaved(isSaved);
                setLikeCount(likeCountResult);
            } catch (error) {
                console.error('Failed to load interaction states:', error);
            }
        };

        loadInteractionStates();
    }, [isAuthenticated, user, params.id]);

    // Load follow state for author
    useEffect(() => {
        if (!isAuthenticated || !user || !post?.author?.id) return;

        const loadFollowState = async () => {
            try {
                const isFollowing = await isFollowingAuthor(user.id, post.author!.id);
                setFollowing(isFollowing);
            } catch (error) {
                console.error('Failed to load follow state:', error);
            }
        };

        loadFollowState();
    }, [isAuthenticated, user, post?.author?.id]);

    // Extract category for related posts query (safe even if post is null)
    const categoryId = post?.tags?.find(t => t.type === 'CATEGORY')?.id;

    // Related posts hooks - called unconditionally at top level
    const { data: relatedByCategory, isLoading: relatedByCategoryLoading } = useRelatedPostsByCategory(
        categoryId,
        params.id,
        4
    );
    const { data: randomPosts, isLoading: randomPostsLoading } = useRandomPosts(params.id, 4);

    const handleLike = async () => {
        if (!isAuthenticated || !user || !params.id || likeLoading) return;

        setLikeLoading(true);
        try {
            if (liked) {
                await unlikePost(user.id, params.id);
                setLiked(false);
                setLikeCount(prev => Math.max(0, prev - 1));
                postUpdateEvents.emit(params.id, 'unlike');
            } else {
                await likePost(user.id, params.id);
                setLiked(true);
                setLikeCount(prev => prev + 1);
                postUpdateEvents.emit(params.id, 'like');
            }
            // Invalidate feed cache so it refetches with updated counts
            queryClient.invalidateQueries({ queryKey: ['feed-posts-optimized'] });
        } catch (error) {
            console.error('Failed to toggle like:', error);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated || !user || !params.id || saveLoading) return;

        setSaveLoading(true);
        try {
            if (saved) {
                await unsavePost(user.id, params.id);
                setSaved(false);
                postUpdateEvents.emit(params.id, 'unsave');
            } else {
                await savePost(user.id, params.id);
                setSaved(true);
                postUpdateEvents.emit(params.id, 'save');
            }
            // Emit event to refresh Header saved posts
            savedPostsEvents.emit();
            // Invalidate feed cache so it refetches with updated counts
            queryClient.invalidateQueries({ queryKey: ['feed-posts-optimized'] });
        } catch (error) {
            console.error('Failed to toggle save:', error);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!isAuthenticated || !user || !post?.author?.id || followLoading) return;

        setFollowLoading(true);
        try {
            if (following) {
                await unfollowAuthor(user.id, post.author.id);
                setFollowing(false);
            } else {
                await followAuthor(user.id, post.author.id);
                setFollowing(true);
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error);
        } finally {
            setFollowLoading(false);
        }
    };

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
                            <a
                                href={`/author/${post.author.id}`}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
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
                                <div className="font-medium text-slate-900 hover:text-primary-600 hover:underline">
                                    {post.author.name}
                                </div>
                            </a>
                            {isAuthenticated ? (
                                <button
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${following
                                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                                        : 'border border-primary-500 text-primary-600 hover:bg-primary-50'
                                        }`}
                                >
                                    {followLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : following ? (
                                        <>
                                            <UserMinus className="w-4 h-4" />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Follow
                                        </>
                                    )}
                                </button>
                            ) : (
                                <Link href="/login">
                                    <button className="px-4 py-1.5 border border-primary-500 text-primary-600 text-sm font-medium rounded-full hover:bg-primary-50 transition-colors">
                                        + Follow
                                    </button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            disabled={!isAuthenticated || likeLoading}
                            className={`flex items-center gap-1.5 transition-colors ${!isAuthenticated
                                ? 'text-slate-400 cursor-not-allowed'
                                : liked
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-slate-500 hover:text-red-500'
                                }`}
                            title={!isAuthenticated ? 'Sign in to like' : liked ? 'Unlike' : 'Like'}
                        >
                            {likeLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                            )}
                            <span className="text-sm">
                                {likeCount > 0 ? likeCount : ''} {liked ? 'Liked' : 'Like'}
                            </span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isAuthenticated || saveLoading}
                            className={`flex items-center gap-1.5 transition-colors ${!isAuthenticated
                                ? 'text-slate-400 cursor-not-allowed'
                                : saved
                                    ? 'text-yellow-600 hover:text-yellow-700'
                                    : 'text-slate-500 hover:text-yellow-600'
                                }`}
                            title={!isAuthenticated ? 'Sign in to save' : saved ? 'Unsave' : 'Save'}
                        >
                            {saveLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                            )}
                            <span className="text-sm">{saved ? 'Saved' : 'Save'}</span>
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
