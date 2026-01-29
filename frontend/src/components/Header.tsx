import { useState } from 'react';
import { Search, SlidersHorizontal, Radar, Bell, Bookmark, Settings, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onRadarClick?: () => void;
    onSettingsClick?: () => void;
}

// Mock data for notifications and saved posts
const mockNotifications = [
    { id: '1', title: 'New insight added: Game Pricing Strategy', time: '2 hours ago', read: false },
    { id: '2', title: 'Trending: Player Retention Analysis', time: '5 hours ago', read: false },
    { id: '3', title: 'Weekly digest is ready', time: '1 day ago', read: true },
];

const mockSavedPosts = [
    { id: '1', title: 'Steam Pricing Research: From $0.0 to $69.99', category: 'Monetization' },
    { id: '2', title: 'The Power of Skip Mechanics in Game Design', category: 'Game Design' },
    { id: '3', title: 'Heartopia by XD Leads Cozy Games', category: 'Market Trends' },
];

export function Header({
    searchQuery,
    onSearchChange,
    onRadarClick,
    onSettingsClick,
}: HeaderProps) {
    const [notificationCount] = useState(mockNotifications.filter(n => !n.read).length);

    return (
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

                    {/* Notifications Dropdown */}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                                <Bell className="w-5 h-5" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                                        {notificationCount}
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
                                    <button className="text-xs text-primary-600 hover:text-primary-700">
                                        Mark all as read
                                    </button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {mockNotifications.map((notification) => (
                                        <DropdownMenu.Item
                                            key={notification.id}
                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer outline-none border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex items-start gap-3">
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                                                )}
                                                <div className={!notification.read ? '' : 'ml-5'}>
                                                    <p className={`text-sm ${notification.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-xs text-slate-400">{notification.time}</span>
                                                </div>
                                            </div>
                                        </DropdownMenu.Item>
                                    ))}
                                </div>
                                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
                                    <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                                        View all notifications
                                    </button>
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
                                    <span className="text-xs text-slate-400">{mockSavedPosts.length} saved</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {mockSavedPosts.map((post) => (
                                        <DropdownMenu.Item
                                            key={post.id}
                                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer outline-none border-b border-slate-50 last:border-0 group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm text-slate-900 font-medium line-clamp-1 group-hover:text-primary-600">
                                                        {post.title}
                                                    </p>
                                                    <span className="text-xs text-slate-400">{post.category}</span>
                                                </div>
                                                <button
                                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </DropdownMenu.Item>
                                    ))}
                                </div>
                                {mockSavedPosts.length === 0 && (
                                    <div className="px-4 py-8 text-center">
                                        <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No saved posts yet</p>
                                    </div>
                                )}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>

                    {/* Settings */}
                    <button
                        onClick={onSettingsClick}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
