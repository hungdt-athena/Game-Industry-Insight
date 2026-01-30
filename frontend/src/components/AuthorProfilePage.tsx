import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { User, Users, ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Author, InsightCardData, Tag } from '@/lib/types';
import { InsightCard } from '@/components/InsightCard';
import { getCategoryColorByName, DEFAULT_CATEGORY_COLOR } from '@/lib/categoryColors';

interface AuthorProfile extends Author {
    followers_count: number;
    posts_count: number;
}

interface Follower {
    id: string;
    follower_id: string;
    followed_at: string;
    user: {
        display_name: string | null;
        email: string;
    };
}

interface CategoryStats {
    name: string;
    count: number;
    colorHex: string;
}

// Get initials from name
function getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export function AuthorProfilePage() {
    const [, params] = useRoute('/author/:id');
    const authorId = params?.id;
    const { user: currentUser } = useAuth();

    const [author, setAuthor] = useState<AuthorProfile | null>(null);
    const [posts, setPosts] = useState<InsightCardData[]>([]);
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);

    useEffect(() => {
        if (authorId) {
            loadAuthorProfile();
        }
    }, [authorId]);

    const loadAuthorProfile = async () => {
        if (!authorId) return;

        setIsLoading(true);
        try {
            // Load author
            const { data: authorData, error: authorError } = await supabase
                .from('authors')
                .select('*')
                .eq('id', authorId)
                .single();

            if (authorError) throw authorError;

            // Count followers
            const { count: followersCount } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', authorId);

            // Count posts
            const { count: postsCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('author_id', authorId);

            setAuthor({
                ...authorData,
                followers_count: followersCount || 0,
                posts_count: postsCount || 0,
            });

            // Check if current user is following
            if (currentUser) {
                const { data: followData } = await supabase
                    .from('user_follows')
                    .select('id')
                    .eq('author_id', authorId)
                    .eq('follower_id', currentUser.id)
                    .maybeSingle();

                setIsFollowing(!!followData);
            }

            // Load posts with like/save counts
            const { data: postsData } = await supabase
                .from('posts')
                .select(`
                    id,
                    title,
                    summary,
                    key_takeaway,
                    sentiment,
                    published_date,
                    created_at,
                    author_id,
                    post_images (image_url),
                    post_tags (
                        tag:tags (id, name, type, metadata)
                    ),
                    post_likes (id),
                    user_saved_posts (id)
                `)
                .eq('author_id', authorId)
                .order('published_date', { ascending: false });

            // Process posts
            const processedPosts: InsightCardData[] = (postsData || []).map((post: any) => {
                const coverImage = post.post_images?.[0]?.image_url || null;
                const tags: Tag[] = (post.post_tags || [])
                    .filter((pt: any) => pt.tag)
                    .map((pt: any) => pt.tag);
                const category = tags.find(t => t.type === 'CATEGORY') || null;

                return {
                    id: post.id,
                    title: post.title,
                    summary: post.summary,
                    key_takeaway: post.key_takeaway,
                    sentiment: post.sentiment,
                    published_date: post.published_date,
                    created_at: post.created_at,
                    author: authorData,
                    cover_image: coverImage,
                    category,
                    cardType: coverImage ? 'image' : 'quote',
                    tags: tags.filter(t => t.type !== 'CATEGORY'),
                    likes_count: post.post_likes?.length || 0,
                    saves_count: post.user_saved_posts?.length || 0,
                };
            });

            setPosts(processedPosts);

            // Calculate category stats
            const catCounts: Record<string, number> = {};
            processedPosts.forEach(post => {
                if (post.category) {
                    catCounts[post.category.name] = (catCounts[post.category.name] || 0) + 1;
                }
            });

            const stats: CategoryStats[] = Object.entries(catCounts).map(([name, count]) => {
                const colorConfig = getCategoryColorByName(name) || DEFAULT_CATEGORY_COLOR;
                return {
                    name,
                    count,
                    colorHex: colorConfig.colorHex,
                };
            }).sort((a, b) => b.count - a.count);

            setCategoryStats(stats);

            // Load followers list
            const { data: followersData } = await supabase
                .from('user_follows')
                .select(`
                    id,
                    follower_id,
                    followed_at,
                    user:users!follower_id (display_name, email)
                `)
                .eq('author_id', authorId)
                .order('followed_at', { ascending: false });

            setFollowers((followersData || []).map((f: any) => ({
                id: f.id,
                follower_id: f.follower_id,
                followed_at: f.followed_at,
                user: f.user || { display_name: null, email: 'Unknown' }
            })));

        } catch (error) {
            console.error('Failed to load author profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser || !authorId) return;

        if (isFollowing) {
            // Unfollow
            await supabase
                .from('user_follows')
                .delete()
                .eq('author_id', authorId)
                .eq('follower_id', currentUser.id);
            setIsFollowing(false);
            setAuthor(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
        } else {
            // Follow
            await supabase
                .from('user_follows')
                .insert({ author_id: authorId, follower_id: currentUser.id });
            setIsFollowing(true);
            setAuthor(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!author) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Author Not Found</h2>
                    <p className="text-slate-500">This author doesn't exist.</p>
                </div>
            </div>
        );
    }

    const maxCategoryCount = categoryStats.length > 0 ? Math.max(...categoryStats.map(s => s.count)) : 1;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                            {/* Avatar with Initials */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
                                <span className="text-3xl font-bold text-white">
                                    {getInitials(author.name)}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-slate-900">{author.name}</h1>
                                {author.slug && (
                                    <p className="text-slate-500 text-sm mt-1">@{author.slug}</p>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <span className="font-semibold text-slate-900">{author.posts_count}</span>
                                        <span className="text-slate-500 text-sm">Posts</span>
                                    </div>
                                    <button
                                        onClick={() => setShowFollowers(!showFollowers)}
                                        className="flex items-center gap-2 hover:bg-slate-50 rounded-lg px-2 py-1 -mx-2 transition-colors"
                                    >
                                        <Users className="w-5 h-5 text-slate-400" />
                                        <span className="font-semibold text-slate-900">{author.followers_count}</span>
                                        <span className="text-slate-500 text-sm">Followers</span>
                                    </button>
                                </div>
                            </div>

                            {/* Follow Button */}
                            {currentUser && (
                                <button
                                    onClick={handleFollow}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${isFollowing
                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>

                        {/* Followers List (expandable) */}
                        {showFollowers && followers.length > 0 && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                                <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Followers ({followers.length})
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {followers.map((follower) => (
                                        <div
                                            key={follower.id}
                                            className="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-white">
                                                        {getInitials(follower.user.display_name || follower.user.email)}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-slate-700">
                                                    {follower.user.display_name || follower.user.email.split('@')[0]}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {formatDate(follower.followed_at)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Stats Chart */}
                        {categoryStats.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-medium text-slate-900 mb-3">Categories</h3>
                                <div className="space-y-2">
                                    {categoryStats.map((stat) => (
                                        <div key={stat.name} className="flex items-center gap-3">
                                            <span className="w-24 text-sm text-slate-600 truncate">{stat.name}</span>
                                            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                                    style={{
                                                        width: `${(stat.count / maxCategoryCount) * 100}%`,
                                                        backgroundColor: stat.colorHex,
                                                        minWidth: '40px'
                                                    }}
                                                >
                                                    <span className="text-xs font-medium text-white">{stat.count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Posts Section */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Posts by {author.name}
                    </h2>

                    {posts.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500">No posts yet</p>
                        </div>
                    ) : (
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4">
                            {posts.map((post) => (
                                <InsightCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthorProfilePage;
