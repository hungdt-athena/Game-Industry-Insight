import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    BookOpen,
    Gamepad2,
    TrendingUp,
    Users,
    Target,
    ChevronRight,
    X,
    Menu,
    LogIn,
    Settings,
    LogOut,
    ShieldCheck,
    User,
    ClipboardList,
} from 'lucide-react';
import { useCategories, useTrendingTags } from '@/lib/queries';
import { useAuth } from '@/lib/AuthContext';
import { TagChip } from './TagChip';
import { SidebarSkeleton } from './Skeletons';
import { UserManagementDialog } from './UserManagementDialog';
import { SettingsDialog } from './SettingsDialog';
import { ActivityLogsDialog } from './ActivityLogsDialog';

interface SidebarProps {
    selectedCategory?: string;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
    'Game Mechanics': <Gamepad2 className="w-4 h-4" />,
    'Monetization Models': <TrendingUp className="w-4 h-4" />,
    'User Retention': <Users className="w-4 h-4" />,
    'Marketing Art': <Target className="w-4 h-4" />,
    default: <BookOpen className="w-4 h-4" />,
};

const roleColors: Record<string, string> = {
    admin: 'text-purple-600',
    moderator: 'text-blue-600',
    user: 'text-slate-500',
};

function SidebarContent({
    selectedCategory,
}: Omit<SidebarProps, 'isMobileOpen' | 'onMobileClose'>) {
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: trendingTags, isLoading: tagsLoading } = useTrendingTags();
    const { user, isAuthenticated, isAdmin, isModerator, logout } = useAuth();
    const [, setLocation] = useLocation();

    const [userManagementOpen, setUserManagementOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activityLogsOpen, setActivityLogsOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        setLocation('/login');
    };

    if (categoriesLoading || tagsLoading) {
        return <SidebarSkeleton />;
    }

    return (
        <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200">
                <Link href="/">
                    <div className="flex justify-center cursor-pointer">
                        <img
                            src="/logo.png"
                            alt="Athena"
                            className="w-32 h-auto object-contain"
                        />
                    </div>
                </Link>
            </div>

            {/* User Profile */}
            <div className="p-4 border-b border-slate-200">
                {isAuthenticated && user ? (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.display_name || 'User'}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white font-medium">
                                            {(user.display_name || user.email).charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-medium text-slate-900">
                                        {user.display_name || user.email.split('@')[0]}
                                    </div>
                                    <div className={`text-xs capitalize ${roleColors[user.role]}`}>
                                        {user.role}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 p-1"
                                sideOffset={8}
                                align="start"
                            >
                                {isModerator && (
                                    <DropdownMenu.Item
                                        onClick={() => setUserManagementOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        User Management
                                    </DropdownMenu.Item>
                                )}
                                {isAdmin && (
                                    <DropdownMenu.Item
                                        onClick={() => setActivityLogsOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                                    >
                                        <ClipboardList className="w-4 h-4" />
                                        Activity Logs
                                    </DropdownMenu.Item>
                                )}
                                <Link href="/profile">
                                    <DropdownMenu.Item
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </DropdownMenu.Item>
                                </Link>
                                <DropdownMenu.Item
                                    onClick={() => setSettingsOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="h-px bg-slate-200 my-1" />
                                <DropdownMenu.Item
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                ) : (
                    <Link href="/login">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </button>
                    </Link>
                )}
            </div>

            {/* Scrollable Content */}
            <ScrollArea.Root className="flex-1 overflow-hidden">
                <ScrollArea.Viewport className="h-full w-full">
                    <div className="p-4 space-y-6">
                        {/* Categories Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                {selectedCategory && (
                                    <Link href="/">
                                        <button className="text-xs text-primary-600 hover:text-primary-700 ml-auto">
                                            Clear
                                        </button>
                                    </Link>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-slate-400 uppercase mb-2">
                                    Categories
                                </div>
                                {(categories || []).map((category) => (
                                    <Link key={category.id} href={`/category/${category.id}`}>
                                        <div
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${selectedCategory === category.id
                                                ? 'bg-primary-50 text-primary-700 font-medium'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            <span className="text-slate-400">
                                                {categoryIcons[category.name] || categoryIcons.default}
                                            </span>
                                            <span className="flex-1 text-left">{category.name}</span>
                                            {selectedCategory === category.id && (
                                                <ChevronRight className="w-4 h-4 text-primary-500" />
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Trending Topics Section */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                Trending Topics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(trendingTags || []).slice(0, 10).map((tag) => (
                                    <TagChip
                                        key={tag.id}
                                        id={tag.id}
                                        name={tag.name}
                                        type={tag.type}
                                        variant="outline"
                                        size="sm"
                                    />
                                ))}
                            </div>
                        </div>


                    </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                    className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
                    orientation="vertical"
                >
                    <ScrollArea.Thumb className="flex-1 bg-slate-300 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                </ScrollArea.Scrollbar>
            </ScrollArea.Root>

            {/* Dialogs */}
            <UserManagementDialog
                open={userManagementOpen}
                onOpenChange={setUserManagementOpen}
            />
            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
            <ActivityLogsDialog
                open={activityLogsOpen}
                onOpenChange={setActivityLogsOpen}
            />
        </div>
    );
}

export function Sidebar({
    selectedCategory,
    isMobileOpen,
    onMobileClose,
}: SidebarProps) {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-[280px] h-screen bg-white border-r border-slate-200 shadow-sidebar fixed left-0 top-0">
                <SidebarContent
                    selectedCategory={selectedCategory}
                />
            </aside>

            {/* Mobile Drawer */}
            <Dialog.Root open={isMobileOpen} onOpenChange={onMobileClose}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
                    <Dialog.Content className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 lg:hidden shadow-xl focus:outline-none">
                        <Dialog.Close className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100">
                            <X className="w-5 h-5 text-slate-500" />
                        </Dialog.Close>
                        <SidebarContent
                            selectedCategory={selectedCategory}
                        />
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}

// Mobile menu button component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
            <Menu className="w-5 h-5" />
        </button>
    );
}

export default Sidebar;
