import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Eye, EyeOff, LogIn, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export function LoginPage() {
    const [, setLocation] = useLocation();
    const { login, isLoading: authLoading, isAuthenticated } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsApproval, setNeedsApproval] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    // Memoize return URL at mount time
    const returnUrl = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const url = params.get('returnUrl');
        return url ? decodeURIComponent(url) : '/';
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setNeedsApproval(false);
        setIsLoading(true);

        try {
            const result = await login(email, password);

            if (result.error) {
                setError(result.error.message);
                setIsLoading(false);
            } else if (result.needsApproval) {
                setNeedsApproval(true);
                setIsLoading(false);
            } else {
                // Login successful - mark success and redirect
                console.log('Login successful, redirecting to:', returnUrl);
                setLoginSuccess(true);
                // Small delay to ensure state is fully updated
                setTimeout(() => {
                    setLocation(returnUrl);
                }, 100);
            }
        } catch (err) {
            console.error('Login submit error:', err);
            setError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    <p className="text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // If already authenticated or just logged in, show redirecting
    if (isAuthenticated || loginSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    <p className="text-slate-500 text-sm">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Athena"
                        className="w-32 h-auto mx-auto"
                    />
                    <h1 className="mt-6 text-2xl font-bold text-slate-900">Welcome back</h1>
                    <p className="mt-2 text-sm text-slate-500">Sign in to your account to continue</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    {needsApproval && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">Account Pending Approval</p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Your account is still waiting for approval from an administrator.
                                    Please try again later.
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-50"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign in
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Need access? Contact your administrator for an invitation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
