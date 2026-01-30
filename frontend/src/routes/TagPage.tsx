import { useParams } from 'wouter';
import { LayoutGrid, List } from 'lucide-react';
import { FeedSkeleton } from '@/components/Skeletons';
import { useFeedPostsOptimized } from '@/lib/hooks';
import { MasonryGrid } from '@/components/MasonryGrid';
import { ListView } from '@/components/ListView';
import { useViewMode } from '@/hooks/useViewMode';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Fetch single tag info
async function getTagById(id: string) {
    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching tag:', error);
        return null;
    }
    return data;
}

export function TagPage() {
    const params = useParams<{ id: string }>();
    const tagId = params.id;
    const { viewMode, setViewMode } = useViewMode();

    // Fetch tag info
    const { data: tag } = useQuery({
        queryKey: ['tag', tagId],
        queryFn: () => getTagById(tagId!),
        enabled: !!tagId,
    });

    // Fetch posts for this tag (using optimized query with likes/saves counts)
    const { data: posts, isLoading } = useFeedPostsOptimized({ tagId });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">
                            #{tag?.name || 'Tag'}
                        </h1>
                        {!isLoading && posts && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                {posts.length} results
                            </span>
                        )}
                    </div>
                    <p className="text-slate-600 mt-1">
                        Posts tagged with #{tag?.name?.toLowerCase() || 'this tag'}
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'grid'
                            ? 'bg-white shadow-sm text-slate-700'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        title="Grid view"
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded transition-all ${viewMode === 'list'
                            ? 'bg-white shadow-sm text-slate-700'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        title="List view"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Posts - Switch between Grid and List view */}
            {isLoading ? (
                <FeedSkeleton />
            ) : posts && posts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏷️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        No posts with this tag
                    </h3>
                    <p className="text-slate-500">
                        Check back later for new content with this tag.
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <MasonryGrid posts={posts || []} isLoading={false} />
            ) : (
                <ListView posts={posts || []} />
            )}
        </div>
    );
}

export default TagPage;
