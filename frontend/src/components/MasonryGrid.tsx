import type { InsightCardData } from '@/lib/types';
import { InsightCard } from './InsightCard';
import { FeedSkeleton } from './Skeletons';

interface MasonryGridProps {
    posts: InsightCardData[];
    isLoading?: boolean;
}

export function MasonryGrid({ posts, isLoading }: MasonryGridProps) {
    if (isLoading) {
        return <FeedSkeleton />;
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-1">No insights yet</h3>
                <p className="text-sm text-slate-500">
                    Check back later for new content
                </p>
            </div>
        );
    }

    return (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
            {posts.map((post) => (
                <InsightCard key={post.id} post={post} />
            ))}
        </div>
    );
}

export default MasonryGrid;
