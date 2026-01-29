export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-card">
            <div className="shimmer h-48 w-full" />
            <div className="p-4 space-y-3">
                <div className="shimmer h-4 w-3/4 rounded" />
                <div className="shimmer h-3 w-1/2 rounded" />
                <div className="flex gap-2">
                    <div className="shimmer h-5 w-16 rounded-full" />
                    <div className="shimmer h-5 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function QuoteCardSkeleton() {
    return (
        <div className="bg-slate-200 rounded-xl overflow-hidden p-6 min-h-[200px]">
            <div className="shimmer h-3 w-20 rounded mb-4" />
            <div className="space-y-2">
                <div className="shimmer h-5 w-full rounded" />
                <div className="shimmer h-5 w-full rounded" />
                <div className="shimmer h-5 w-3/4 rounded" />
            </div>
            <div className="mt-6 flex items-center gap-2">
                <div className="shimmer h-8 w-8 rounded-full" />
                <div className="shimmer h-3 w-24 rounded" />
            </div>
        </div>
    );
}

export function SidebarSkeleton() {
    return (
        <div className="space-y-6 p-4">
            {/* Profile skeleton */}
            <div className="flex items-center gap-3">
                <div className="shimmer h-10 w-10 rounded-full" />
                <div className="space-y-1">
                    <div className="shimmer h-4 w-24 rounded" />
                    <div className="shimmer h-3 w-16 rounded" />
                </div>
            </div>

            {/* Filters skeleton */}
            <div className="space-y-3">
                <div className="shimmer h-4 w-28 rounded" />
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="shimmer h-6 w-full rounded" />
                    ))}
                </div>
            </div>

            {/* Tags skeleton */}
            <div className="space-y-3">
                <div className="shimmer h-4 w-32 rounded" />
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="shimmer h-6 w-16 rounded-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function FeedSkeleton() {
    return (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                i % 2 === 0 ? <CardSkeleton key={i} /> : <QuoteCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function PostDetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Breadcrumb */}
            <div className="flex gap-2">
                <div className="shimmer h-4 w-16 rounded" />
                <div className="shimmer h-4 w-24 rounded" />
            </div>

            {/* Title */}
            <div className="space-y-2">
                <div className="shimmer h-8 w-3/4 rounded" />
                <div className="shimmer h-8 w-1/2 rounded" />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4">
                <div className="shimmer h-10 w-10 rounded-full" />
                <div className="shimmer h-4 w-32 rounded" />
            </div>

            {/* Key takeaway */}
            <div className="shimmer h-32 w-full rounded-xl" />

            {/* Content */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="shimmer h-4 w-full rounded" />
                ))}
            </div>
        </div>
    );
}
