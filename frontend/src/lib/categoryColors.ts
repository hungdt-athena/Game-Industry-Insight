// Category Color Configuration
// Centralized color definitions for all categories

export interface CategoryColorConfig {
    name: string;
    colorHex: string;        // Main color (for backgrounds, text highlights)
    badgeBg: string;         // Tailwind classes for badge background
    badgeText: string;       // Badge text color
    lightBg: string;         // Light background variant for cards
}

export const CATEGORY_COLORS: Record<string, CategoryColorConfig> = {
    monetization: {
        name: 'Monetization',
        colorHex: '#34D399',      // Softer emerald
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        lightBg: 'bg-emerald-100',
    },
    'game-design': {
        name: 'Game Design',
        colorHex: '#A78BFA',      // Softer violet
        badgeBg: 'bg-violet-50',
        badgeText: 'text-violet-700',
        lightBg: 'bg-violet-100',
    },
    liveops: {
        name: 'LiveOps',
        colorHex: '#60A5FA',      // Softer blue
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        lightBg: 'bg-blue-100',
    },
    'market-trends': {
        name: 'Market Trends',
        colorHex: '#F472B6',      // Softer pink
        badgeBg: 'bg-pink-50',
        badgeText: 'text-pink-700',
        lightBg: 'bg-pink-100',
    },
    psychology: {
        name: 'Psychology',
        colorHex: '#FBBF24',      // Softer amber/yellow
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        lightBg: 'bg-amber-100',
    },
    'user-acquisition': {
        name: 'User Acquisition',
        colorHex: '#FB7185',      // Softer rose
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        lightBg: 'bg-rose-100',
    },
};

// Helper function to get category color by slug
export function getCategoryColor(categorySlug: string): CategoryColorConfig | null {
    return CATEGORY_COLORS[categorySlug.toLowerCase()] || null;
}

// Helper function to get category color by name (case-insensitive)
export function getCategoryColorByName(categoryName: string): CategoryColorConfig | null {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
    return getCategoryColor(slug);
}

// Default fallback color
export const DEFAULT_CATEGORY_COLOR: CategoryColorConfig = {
    name: 'General',
    colorHex: '#94A3B8',      // Softer gray
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    lightBg: 'bg-slate-100',
};
