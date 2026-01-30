import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, SlidersHorizontal, Radar, Bell, Bookmark, Settings, X, LogIn, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import {
    getSavedPosts,
    getNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    deleteNotification,
    unsavePost,
    type SavedPostData,
    type Notification
} from '@/lib/queries-auth';
import { SettingsDialog } from './SettingsDialog';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onRadarClick?: () => void;
}

export function Header({
    searchQuery,
    onSearchChange,
    onRadarClick,
}: HeaderProps) {
    const { user, isAuthenticated } = useAuth();
    const [, setLocation] = useLocation();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [savedPosts, setSavedPosts] = useState<SavedPostData[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Load saved posts (also triggered by event)
    const loadSavedPosts = async () => {
        if (!user) return;
        try {
            const saved = await getSavedPosts(user.id);
            setSavedPosts(saved);
        } catch (error) {
            console.error('Failed to load saved posts:', error);
        }
    };

    // Load notifications and saved posts on mount
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const loadData = async () => {
            try {
                const [notifs, saved, unreadCount] = await Promise.all([
                    getNotifications(user.id),
                    getSavedPosts(user.id),
                    getUnreadNotificationCount(user.id),
                ]);
                setNotifications(notifs);
                setSavedPosts(saved);
                setNotificationCount(unreadCount);
            } catch (error) {
                console.error('Failed to load header data:', error);
            }
        };

        loadData();
    }, [isAuthenticated, user]);

    // Subscribe to saved posts updates from PostDetailPage
    useEffect(() => {
        // Import here to avoid circular dependency
        import('@/lib/savedPostsEvents').then(({ savedPostsEvents }) => {
            const unsubscribe = savedPostsEvents.subscribe(() => {
                loadSavedPosts();
            });
            return () => unsubscribe();
        });
    }, [user]);

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            await markAllNotificationsAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setNotificationCount(0);
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const handleUnsavePost = async (postId: string) => {
        if (!user) return;
        try {
            await unsavePost(user.id, postId);
            setSavedPosts(prev => prev.filter(p => p.post_id !== postId));
        } catch (error) {
            console.error('Failed to unsave post:', error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <>
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search for insights here..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 bg-slate-100 border border-transparent rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Radar Button */}
                        <button
                            onClick={onRadarClick}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            <Radar className="w-4 h-4" />
                            <span className="hidden sm:inline">Radar</span>
                        </button>

                        {isAuthenticated && user ? (
                            <>
                                {/* Notifications Dropdown */}
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                                            <Bell className="w-5 h-5" />
                                            {notificationCount > 0 && (
                                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                                                    {notificationCount > 9 ? '9+' : notificationCount}
                                                </span>
                                            )}
                                        </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="min-w-[320px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                                            sideOffset={8}
                                            align="end"
                                        >
                                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="font-semibold text-slate-900">Notifications</h3>
                                                {notificationCount > 0 && (
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-xs text-primary-600 hover:text-primary-700"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-8 text-center">
                                                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 group"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {!notification.is_read && (
                                                                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                                                                )}
                                                                <div className={`flex-1 ${!notification.is_read ? '' : 'ml-5'}`}>
                                                                    <p className={`text-sm ${notification.is_read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                                                        {notification.title}
                                                                    </p>
                                                                    {notification.message && (
                                                                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                                                            {notification.message}
                                                                        </p>
                                                                    )}
                                                                    <span className="text-xs text-slate-400">
                                                                        {formatTimeAgo(notification.created_at)}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            await deleteNotification(notification.id);
                                                                            setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                                                            if (!notification.is_read) {
                                                                                setNotificationCount(prev => Math.max(0, prev - 1));
                                                                            }
                                                                        } catch (error) {
                                                                            console.error('Failed to delete notification:', error);
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                                    title="Delete notification"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>

                                {/* Saved Posts Dropdown */}
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                                            <Bookmark className="w-5 h-5" />
                                        </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.Content
                                            className="min-w-[320px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                                            sideOffset={8}
                                            align="end"
                                        >
                                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <h3 className="font-semibold text-slate-900">Saved Posts</h3>
                                                <span className="text-xs text-slate-400">{savedPosts.length} saved</span>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {savedPosts.length === 0 ? (
                                                    <div className="px-4 py-8 text-center">
                                                        <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500">No saved posts yet</p>
                                                    </div>
                                                ) : (
                                                    savedPosts.map((saved) => (
                                                        <DropdownMenu.Item
                                                            key={saved.id}
                                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer outline-none border-b border-slate-50 last:border-0 group"
                                                            onClick={() => setLocation(`/post/${saved.post_id}`)}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-sm text-slate-900 font-medium line-clamp-1 group-hover:text-primary-600">
                                                                        {saved.post.title}
                                                                    </p>
                                                                    <span className="text-xs text-slate-400">
                                                                        {saved.post.category_name || 'Uncategorized'}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleUnsavePost(saved.post_id);
                                                                    }}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </DropdownMenu.Item>
                                                    ))
                                                )}
                                            </div>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Root>

                                {/* Settings */}
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <Link href="/login">
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign In</span>
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </>
    );
}

export default Header;
