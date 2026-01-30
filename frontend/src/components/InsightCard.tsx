import { Link } from 'wouter';
import { Heart, Bookmark } from 'lucide-react';
import type { InsightCardData } from '@/lib/types';
import { TagChip } from './TagChip';
import { getCategoryColorByName, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';

interface InsightCardProps {
    post: InsightCardData;
}

// Color gradients for quote cards (cycling based on post id)
const quoteGradients = [
    'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
    'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600',
    'bg-gradient-to-br from-orange-300 via-orange-400 to-amber-500',
    'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
    'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600',
    'card-gradient-peach',
];

function getGradientClass(id: string): string {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return quoteGradients[hash % quoteGradients.length];
}

export function InsightCard({ post }: InsightCardProps) {
    const { cardType, cover_image } = post;

    if (cardType === 'image' && cover_image) {
        return <ImageCard post={post} />;
    }

    return <QuoteCard post={post} />;
}

function ImageCard({ post }: InsightCardProps) {
    const { id, title, author, cover_image, category, published_date, key_takeaway, tags } = post;

    // Get category color config
    const categoryColorConfig = category
        ? getCategoryColorByName(category.name) || DEFAULT_CATEGORY_COLOR
        : DEFAULT_CATEGORY_COLOR;

    return (
        <Link href={`/post/${id}`}>
            <article className="group relative bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer break-inside-avoid mb-4">
                {/* Image Container */}
                <div className="relative overflow-hidden">
                    <img
                        src={cover_image!}
                        alt={title}
                        className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />

                    {/* Hover Overlay with Key Takeaway and Tags */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        {/* Key Takeaway */}
                        {key_takeaway && (
                            <div className="mb-3">
                                <p className="text-white text-sm italic line-clamp-3">
                                    "{key_takeaway}"
                                </p>
                            </div>
                        )}

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {tags.slice(0, 4).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white/90"
                                    >
                                        #{tag.name}
                                    </span>
                                ))}
                                {tags.length > 4 && (
                                    <span className="px-2 py-0.5 text-xs text-white/70">
                                        +{tags.length - 4}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Category Badge */}
                    {category && (
                        <div className="absolute top-3 left-3">
                            <TagChip
                                name={category.name}
                                type={category.type}
                                size="sm"
                                categoryColorConfig={categoryColorConfig}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3
                        className="font-semibold line-clamp-2 group-hover:opacity-90 transition-colors"
                        style={{ color: categoryColorConfig.colorHex }}
                    >
                        {title}
                    </h3>

                    {/* Published Date */}
                    {published_date && (
                        <div className="mt-1 text-xs text-slate-400">
                            {new Date(published_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </div>
                    )}

                    {author && (
                        <div className="mt-2 flex items-center justify-between">
                            <a
                                href={`/author/${author.id}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                className="flex items-center gap-2 hover:opacity-75 transition-opacity z-10 relative"
                            >
                                {author.avatar_url ? (
                                    <img
                                        src={author.avatar_url}
                                        alt={author.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{
                                            backgroundColor: categoryColorConfig.colorHex + '20',
                                            color: categoryColorConfig.colorHex
                                        }}
                                    >
                                        <span className="text-xs font-medium">
                                            {author.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <span className="text-sm text-slate-500 hover:text-slate-700 hover:underline">{author.name}</span>
                            </a>
                            {/* Likes and Saves counts */}
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                {(post.likes_count ?? 0) > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5" />
                                        {post.likes_count}
                                    </span>
                                )}
                                {(post.saves_count ?? 0) > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Bookmark className="w-3.5 h-3.5" />
                                        {post.saves_count}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </Link>
    );
}

function QuoteCard({ post }: InsightCardProps) {
    const { id, title, key_takeaway, author, category, tags } = post;
    const gradientClass = getGradientClass(id);

    // Get category color config
    const categoryColorConfig = category
        ? getCategoryColorByName(category.name) || DEFAULT_CATEGORY_COLOR
        : null;

    const bgStyle = categoryColorConfig
        ? { backgroundColor: categoryColorConfig.colorHex }
        : undefined;
    const bgClass = categoryColorConfig ? '' : gradientClass;

    return (
        <Link href={`/post/${id}`}>
            <article
                className={`group relative rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer break-inside-avoid mb-4 p-5 min-h-[180px] ${bgClass}`}
                style={bgStyle}
            >
                {/* Category Label */}
                {category && (
                    <div className="mb-3">
                        <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                            {category.name}
                        </span>
                    </div>
                )}

                {/* Quote / Key Takeaway */}
                <blockquote className="text-white font-medium leading-relaxed">
                    <p className="text-sm md:text-base line-clamp-5">
                        "{key_takeaway || title}"
                    </p>
                </blockquote>

                {/* Tags - Show on hover */}
                {tags && tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag.id}
                                className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white/90"
                            >
                                #{tag.name}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-white/70">
                                +{tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Author */}
                {author && (
                    <div className="mt-4 flex items-center justify-between">
                        <a
                            href={`/author/${author.id}`}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className="flex items-center gap-2 hover:opacity-75 transition-opacity z-10 relative"
                        >
                            {author.avatar_url ? (
                                <img
                                    src={author.avatar_url}
                                    alt={author.name}
                                    className="w-7 h-7 rounded-full object-cover border-2 border-white/30"
                                />
                            ) : (
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white/30"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                >
                                    <span className="text-xs font-medium text-white">
                                        {author.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <span className="text-sm text-white/90 hover:underline">{author.name}</span>
                        </a>
                        {/* Likes and Saves counts */}
                        <div className="flex items-center gap-3 text-xs text-white/70">
                            {(post.likes_count ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5" />
                                    {post.likes_count}
                                </span>
                            )}
                            {(post.saves_count ?? 0) > 0 && (
                                <span className="flex items-center gap-1">
                                    <Bookmark className="w-3.5 h-3.5" />
                                    {post.saves_count}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl pointer-events-none" />
            </article>
        </Link>
    );
}

export default InsightCard;
