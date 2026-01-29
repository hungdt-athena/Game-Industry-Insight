import { useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [location] = useLocation();

    // Extract selectedCategory from URL if on category page
    const categoryMatch = location.match(/^\/category\/(.+)$/);
    const selectedCategory = categoryMatch ? categoryMatch[1] : undefined;

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Sidebar */}
            <Sidebar
                selectedCategory={selectedCategory}
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <div className="lg:pl-[280px]">
                {/* Mobile Header Bar */}
                <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
                    <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <span className="font-semibold text-slate-900">Insight Library</span>
                    </div>
                </div>

                {/* Desktop Header */}
                <Header
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                {/* Page Content */}
                <main className="p-4 md:p-6">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AppShell;
