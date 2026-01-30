import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

// User roles
export type UserRole = 'admin' | 'moderator' | 'user';

// App user profile (from public.users table)
export interface AppUser {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    is_approved: boolean;
    created_at: string;
}

interface AuthContextType {
    user: AppUser | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isApproved: boolean;
    isAdmin: boolean;
    isModerator: boolean;
    login: (email: string, password: string) => Promise<{ error: AuthError | null; needsApproval?: boolean }>;
    register: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Simple profile fetcher with timeout to prevent stuck loading
    const fetchUserProfile = useCallback(async (userId: string): Promise<AppUser | null> => {
        console.log('[Auth] Fetching profile for:', userId);
        const startTime = Date.now();

        try {
            // Create a timeout promise (3 seconds)
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Profile fetch timeout after 3s')), 3000);
            });

            // Race between fetch and timeout
            const { data, error } = await Promise.race([
                supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single(),
                timeoutPromise
            ]);

            const elapsed = Date.now() - startTime;
            console.log(`[Auth] Profile query took ${elapsed}ms`);

            if (error) {
                console.error('[Auth] Profile fetch error:', error.message, error);
                return null;
            }

            console.log('[Auth] Profile loaded:', data?.email, 'role:', data?.role);
            return data as AppUser;
        } catch (err) {
            const elapsed = Date.now() - startTime;
            console.error(`[Auth] Profile fetch exception after ${elapsed}ms:`, err);
            return null;
        }
    }, []);

    // Initialize auth on mount
    useEffect(() => {
        // Use local variable for this effect instance
        let isMounted = true;
        console.log('[Auth] ===== Starting Auth Initialization =====');

        // Check localStorage directly first
        const storageKey = 'game-industry-insight-auth';
        const stored = localStorage.getItem(storageKey);
        console.log('[Auth] LocalStorage has auth data:', !!stored);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log('[Auth] Stored session email:', parsed?.user?.email || 'no email');
            } catch (e) {
                console.error('[Auth] Error parsing stored session:', e);
            }
        }

        const initializeAuth = async () => {
            try {
                // Get current session from Supabase
                console.log('[Auth] Calling supabase.auth.getSession()...');
                const { data, error } = await supabase.auth.getSession();

                console.log('[Auth] getSession completed, isMounted:', isMounted);

                if (error) {
                    console.error('[Auth] getSession error:', error);
                }

                const currentSession = data?.session;
                console.log('[Auth] getSession result:', currentSession?.user?.email || 'NO SESSION');

                // ALWAYS update state regardless of isMounted for loading state
                if (!currentSession) {
                    console.log('[Auth] No session found, setting isLoading to false');
                    setSession(null);
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // We have a session, set it
                console.log('[Auth] Setting session for:', currentSession.user.email);
                setSession(currentSession);

                // Fetch user profile
                const profile = await fetchUserProfile(currentSession.user.id);

                if (profile) {
                    console.log('[Auth] Setting user profile:', profile.email);
                    setUser(profile);
                } else {
                    console.warn('[Auth] Could not load profile, session exists but no profile');
                    setUser(null);
                }

                console.log('[Auth] Setting isLoading to false');
                setIsLoading(false);
                console.log('[Auth] ===== Initialization Complete =====');

            } catch (err) {
                console.error('[Auth] Initialization error:', err);
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('[Auth] onAuthStateChange:', event, newSession?.user?.email || 'no session');

                if (!isMounted) return;

                if (event === 'SIGNED_OUT' || !newSession) {
                    console.log('[Auth] User signed out');
                    setSession(null);
                    setUser(null);
                    return;
                }

                if (event === 'SIGNED_IN') {
                    console.log('[Auth] User signed in, fetching profile');
                    setSession(newSession);

                    const profile = await fetchUserProfile(newSession.user.id);
                    if (isMounted) {
                        setUser(profile);
                    }
                    return;
                }

                if (event === 'TOKEN_REFRESHED') {
                    console.log('[Auth] Token refreshed');
                    setSession(newSession);
                    return;
                }

                // For INITIAL_SESSION, we already handled it in initializeAuth
                // but update state if needed
                if (event === 'INITIAL_SESSION' && newSession) {
                    console.log('[Auth] Initial session event');
                    if (!session) {
                        setSession(newSession);
                        if (!user && newSession.user.id) {
                            const profile = await fetchUserProfile(newSession.user.id);
                            if (isMounted) {
                                setUser(profile);
                                setIsLoading(false);
                            }
                        }
                    }
                }
            }
        );

        return () => {
            console.log('[Auth] Cleanup');
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchUserProfile]);

    // Login function
    const login = useCallback(async (email: string, password: string) => {
        try {
            console.log('[Auth] Login attempt for:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Auth] Login error:', error.message);
                return { error };
            }

            if (!data.session || !data.user) {
                return {
                    error: {
                        message: 'Login failed - no session returned',
                        name: 'AuthError',
                        status: 400
                    } as AuthError
                };
            }

            console.log('[Auth] Login successful, fetching profile');
            const profile = await fetchUserProfile(data.user.id);

            if (!profile) {
                return {
                    error: {
                        message: 'Could not load user profile',
                        name: 'ProfileError',
                        status: 404
                    } as AuthError
                };
            }

            if (!profile.is_approved) {
                console.log('[Auth] User not approved');
                return { error: null, needsApproval: true };
            }

            setSession(data.session);
            setUser(profile);

            return { error: null };
        } catch (err) {
            console.error('[Auth] Login exception:', err);
            return {
                error: {
                    message: 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500
                } as AuthError
            };
        }
    }, [fetchUserProfile]);

    // Register function
    const register = useCallback(async (email: string, password: string, displayName?: string) => {
        try {
            console.log('[Auth] Register attempt for:', email);
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName || email.split('@')[0]
                    }
                }
            });

            if (error) {
                console.error('[Auth] Register error:', error.message);
                return { error };
            }

            // Sign out after registration - user needs approval
            await supabase.auth.signOut();
            return { error: null };
        } catch (err) {
            console.error('[Auth] Register exception:', err);
            return {
                error: {
                    message: 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500
                } as AuthError
            };
        }
    }, []);

    // Logout function
    const logout = useCallback(async () => {
        console.log('[Auth] Logging out');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    }, []);

    // Refresh user profile
    const refreshUser = useCallback(async () => {
        if (session?.user?.id) {
            console.log('[Auth] Refreshing user profile');
            const profile = await fetchUserProfile(session.user.id);
            setUser(profile);
        }
    }, [session, fetchUserProfile]);

    // Computed values
    const isAuthenticated = !!session && !!user && user.is_approved;
    const isApproved = user?.is_approved ?? false;
    const isAdmin = user?.role === 'admin';
    const isModerator = user?.role === 'admin' || user?.role === 'moderator';

    // Debug log on state change
    useEffect(() => {
        console.log('[Auth] State changed:', {
            isLoading,
            hasSession: !!session,
            hasUser: !!user,
            isAuthenticated,
            userEmail: user?.email
        });
    }, [isLoading, session, user, isAuthenticated]);

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated,
        isApproved,
        isAdmin,
        isModerator,
        login,
        register,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
