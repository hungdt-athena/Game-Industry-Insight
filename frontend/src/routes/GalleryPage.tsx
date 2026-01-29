import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LayoutGrid, List, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useFeedPosts } from '@/lib/queries';
import { MasonryGrid } from '@/components/MasonryGrid';
import { ListView } from '@/components/ListView';
import { useViewMode } from '@/hooks/useViewMode';

type SortOption = 'relevance' | 'date' | 'popular';

export function GalleryPage() {
    const [sortBy, setSortBy] = useState<SortOption>('relevance');
    const { viewMode, setViewMode } = useViewMode();
    const { data: posts, isLoading, error } = useFeedPosts({ limit: 30 });

    const sortLabels: Record<SortOption, string> = {
        relevance: 'Relevance',
        date: 'Date',
        popular: 'Popular',
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">Discover</h1>
                        {!isLoading && posts && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                {posts.length} results
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sort Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                <span>Sort by:</span>
                                <span className="font-medium text-slate-900">{sortLabels[sortBy]}</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="min-w-[160px] bg-white rounded-lg shadow-lg border border-slate-200 p-1 z-50"
                                sideOffset={5}
                            >
                                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                                    <DropdownMenu.Item
                                        key={option}
                                        className={`flex items-center px-3 py-2 text-sm rounded-md cursor-pointer outline-none ${sortBy === option
                                            ? 'bg-primary-50 text-primary-700'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        onSelect={() => setSortBy(option)}
                                    >
                                        {sortLabels[option]}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

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
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">Error loading insights</p>
                    <p className="text-sm mt-1">{(error as Error).message}</p>
                </div>
            )}

            {/* Feed - Switch between Grid and List view */}
            {viewMode === 'grid' ? (
                <MasonryGrid posts={posts || []} isLoading={isLoading} />
            ) : (
                isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex bg-white rounded-xl overflow-hidden shadow-card animate-pulse">
                                <div className="w-32 h-24 bg-slate-200" />
                                <div className="flex-1 p-4 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ListView posts={posts || []} />
                )
            )}

            {/* Load More Button */}
            {posts && posts.length >= 30 && (
                <div className="flex justify-center pt-4">
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                        <span>Loading more insights...</span>
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default GalleryPage;
