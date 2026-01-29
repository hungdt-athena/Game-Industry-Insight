import { Link } from 'wouter';
import * as Dialog from '@radix-ui/react-dialog';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import {
    BookOpen,
    Gamepad2,
    TrendingUp,
    Users,
    Target,
    ChevronRight,
    X,
    Menu,
} from 'lucide-react';
import { useCategories, useTrendingTags } from '@/lib/queries';
import { TagChip } from './TagChip';
import { SidebarSkeleton } from './Skeletons';

interface SidebarProps {
    selectedCategory?: string;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

// Mock user data for the profile section
const mockUser = {
    name: 'Alex Designer',
    role: 'UI Researcher',
    avatar: null,
};

// Category icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
    'Game Mechanics': <Gamepad2 className="w-4 h-4" />,
    'Monetization Models': <TrendingUp className="w-4 h-4" />,
    'User Retention': <Users className="w-4 h-4" />,
    'Marketing Art': <Target className="w-4 h-4" />,
    default: <BookOpen className="w-4 h-4" />,
};

function SidebarContent({
    selectedCategory,
}: Omit<SidebarProps, 'isMobileOpen' | 'onMobileClose'>) {
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: trendingTags, isLoading: tagsLoading } = useTrendingTags();

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
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        {mockUser.avatar ? (
                            <img
                                src={mockUser.avatar}
                                alt={mockUser.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-white font-medium">
                                {mockUser.name.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="font-medium text-slate-900">{mockUser.name}</div>
                        <div className="text-xs text-slate-500">{mockUser.role}</div>
                    </div>
                </div>
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
