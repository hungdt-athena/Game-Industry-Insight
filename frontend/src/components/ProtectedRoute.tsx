import { ReactNode } from 'react';
import { useLocation, Redirect } from 'wouter';
import { useAuth } from '@/lib/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const [location] = useLocation();

    console.log('ProtectedRoute check:', { isAuthenticated, isLoading, location });

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(location);
        console.log('Not authenticated, redirecting to login with returnUrl:', returnUrl);
        return <Redirect to={`/login?returnUrl=${returnUrl}`} />;
    }

    console.log('Authenticated, rendering children');
    return <>{children}</>;
}

export default ProtectedRoute;
