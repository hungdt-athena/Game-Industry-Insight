import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Settings, LogOut, Sun, ChevronRight, Key, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Change password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            onOpenChange(false);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setPasswordLoading(true);

        try {
            // First verify current password by re-authenticating
            if (user?.email) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword,
                });

                if (signInError) {
                    setPasswordError('Current password is incorrect');
                    setPasswordLoading(false);
                    return;
                }
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                setPasswordError(error.message);
            } else {
                setPasswordSuccess(true);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    setShowPasswordForm(false);
                    setPasswordSuccess(false);
                }, 2000);
            }
        } catch (err) {
            setPasswordError('An unexpected error occurred');
        } finally {
            setPasswordLoading(false);
        }
    };

    const resetPasswordForm = () => {
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
        setPasswordSuccess(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={(newOpen) => {
            if (!newOpen) resetPasswordForm();
            onOpenChange(newOpen);
        }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-slate-900">
                                    Settings
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-slate-500">
                                    Manage your preferences
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </Dialog.Close>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                        {/* User Info */}
                        {user && (
                            <div className="p-4 bg-slate-50 rounded-xl mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                            {(user.display_name || user.email).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {user.display_name || user.email.split('@')[0]}
                                        </p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Change Password */}
                        {showPasswordForm ? (
                            <form onSubmit={handleChangePassword} className="p-4 bg-slate-50 rounded-xl space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-slate-900">Change Password</h3>
                                    <button
                                        type="button"
                                        onClick={resetPasswordForm}
                                        className="text-sm text-slate-500 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-red-600">{passwordError}</p>
                                )}

                                {passwordSuccess && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <Check className="w-4 h-4" />
                                        Password changed successfully!
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {passwordLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setShowPasswordForm(true)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-slate-900">Change Password</p>
                                        <p className="text-sm text-slate-500">Update your security credentials</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </button>
                        )}

                        {/* Settings Options */}
                        <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Sun className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-slate-900">Appearance</p>
                                    <p className="text-sm text-slate-500">Light mode</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </button>
                    </div>

                    {/* Footer - Logout */}
                    <div className="p-4 border-t border-slate-200">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </>
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default SettingsDialog;
