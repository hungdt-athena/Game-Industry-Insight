import { Link } from 'wouter';
import { Clock, Quote } from 'lucide-react';
import type { InsightCardData } from '@/lib/types';
import { getCategoryColorByName, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';

interface RelatedPostCardProps {
    post: InsightCardData;
}

function RelatedPostCard({ post }: RelatedPostCardProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Get category color
    const categoryColor = post.category
        ? getCategoryColorByName(post.category.name) || DEFAULT_CATEGORY_COLOR
        : DEFAULT_CATEGORY_COLOR;

    return (
        <Link href={`/post/${post.id}`}>
            <div className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                {/* Cover Image or Tag Placeholder */}
                {post.cover_image ? (
                    <div className="aspect-[16/9] overflow-hidden">
                        <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                    </div>
                ) : (
                    <div
                        className="aspect-[16/9] flex flex-col justify-center items-center p-4"
                        style={{ backgroundColor: categoryColor.lightBg }}
                    >
                        {/* Category Tag */}
                        {post.category && (
                            <span
                                className="px-3 py-1 rounded-full text-xs font-semibold mb-3"
                                style={{
                                    backgroundColor: `${categoryColor.colorHex}20`,
                                    color: categoryColor.colorHex
                                }}
                            >
                                {post.category.name}
                            </span>
                        )}

                        {/* Key Takeaway or Quote Icon */}
                        {post.key_takeaway ? (
                            <p
                                className="text-sm text-center line-clamp-3 italic font-medium"
                                style={{ color: categoryColor.colorHex }}
                            >
                                "{post.key_takeaway}"
                            </p>
                        ) : (
                            <Quote
                                className="w-8 h-8 opacity-30"
                                style={{ color: categoryColor.colorHex }}
                            />
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    <h4 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {post.title}
                    </h4>

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                        {post.published_date && (
                            <span>{formatDate(post.published_date)}</span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            6 min
                        </span>
                    </div>

                    {post.author && (
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                                {post.author.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <span className="text-xs text-slate-600">{post.author.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

interface RelatedPostsSectionProps {
    title: string;
    posts: InsightCardData[];
    isLoading?: boolean;
}

export function RelatedPostsSection({ title, posts, isLoading }: RelatedPostsSectionProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                            <div className="aspect-[16/9] bg-slate-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                                    <div className="h-3 bg-slate-200 rounded w-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                    <RelatedPostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}

export default RelatedPostsSection;
