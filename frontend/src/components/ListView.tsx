import { Link } from 'wouter';
import type { InsightCardData, Tag } from '@/lib/types';
import { getCategoryColorByName, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';

interface ListCardProps {
    post: InsightCardData;
}

function ListCard({ post }: ListCardProps) {
    const { id, title, key_takeaway, cover_image, category, tags } = post;

    // Get category color config
    const categoryColorConfig = category
        ? getCategoryColorByName(category.name) || DEFAULT_CATEGORY_COLOR
        : DEFAULT_CATEGORY_COLOR;

    return (
        <Link href={`/post/${id}`}>
            <article className="group flex bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer">
                {/* Left: Image or Color Box */}
                <div className="w-24 sm:w-32 flex-shrink-0">
                    {cover_image ? (
                        <img
                            src={cover_image}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: categoryColorConfig.colorHex }}
                        >
                            <span className="text-white text-2xl font-bold opacity-50">
                                {category?.name?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Middle: Title + Key Takeaway */}
                <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                    <h3
                        className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:opacity-80 transition-colors"
                        style={{ color: categoryColorConfig.colorHex }}
                    >
                        {title}
                    </h3>
                    {key_takeaway && (
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 line-clamp-2 italic">
                            "{key_takeaway}"
                        </p>
                    )}
                </div>

                {/* Right: Tags */}
                <div className="hidden sm:flex flex-col justify-center items-end gap-1.5 p-4 pl-2 max-w-[180px]">
                    {/* Category Tag */}
                    {category && (
                        <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{
                                backgroundColor: `${categoryColorConfig.colorHex}15`,
                                color: categoryColorConfig.colorHex
                            }}
                        >
                            {category.name}
                        </span>
                    )}
                    {/* Topic Tags */}
                    <div className="flex flex-wrap gap-1 justify-end">
                        {(tags || []).slice(0, 2).map((tag: Tag) => (
                            <span
                                key={tag.id}
                                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs whitespace-nowrap"
                            >
                                #{tag.name}
                            </span>
                        ))}
                        {(tags || []).length > 2 && (
                            <span className="text-xs text-slate-400">
                                +{(tags || []).length - 2}
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}

interface ListViewProps {
    posts: InsightCardData[];
}

export function ListView({ posts }: ListViewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {posts.map((post) => (
                <ListCard key={post.id} post={post} />
            ))}
        </div>
    );
}

export default ListView;
