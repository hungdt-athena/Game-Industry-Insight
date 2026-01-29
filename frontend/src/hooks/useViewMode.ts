import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'insight-view-mode';

export function useViewMode() {
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        // Initialize from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'list' || saved === 'grid') {
                return saved;
            }
        }
        return 'grid';
    });

    // Persist to localStorage when changed
    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        localStorage.setItem(STORAGE_KEY, mode);
    };

    // Sync with other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'grid' || e.newValue === 'list')) {
                setViewModeState(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return { viewMode, setViewMode };
}

export default useViewMode;
