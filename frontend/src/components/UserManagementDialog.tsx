import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Users, Trash2, Search, AlertTriangle, UserPlus, Copy, Check, Key, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    inviteUser,
    resetUserPassword,
    SUPER_ADMIN_EMAIL,
    type AppUser
} from '@/lib/queries-auth';
import type { UserRole } from '@/lib/AuthContext';

interface UserManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Tab = 'invite' | 'all';

interface UserCredentials {
    email: string;
    password: string;
    displayName: string;
    role: string;
    siteUrl: string;
}

const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    admin: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    moderator: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    user: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export function UserManagementDialog({ open, onOpenChange }: UserManagementDialogProps) {
    const { user: currentUser, isAdmin, isModerator } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('invite');
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteDisplayName, setInviteDisplayName] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('user');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Credentials modal state
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials, setCredentials] = useState<UserCredentials | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Delete confirmation state
    const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null);
    const [deleteEmailInput, setDeleteEmailInput] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // Reset password confirmation state
    const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

    // Check if current user is super admin
    const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

    const loadData = async () => {
        setIsLoading(true);
        try {
            const all = await getAllUsers();
            setAllUsers(all);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || inviteLoading) return;

        setInviteLoading(true);
        setInviteError(null);

        try {
            const result = await inviteUser(
                inviteEmail.trim(),
                inviteDisplayName.trim() || undefined,
                inviteRole
            );

            if (result.credentials) {
                setCredentials(result.credentials);
                setShowCredentials(true);
            }

            setInviteEmail('');
            setInviteDisplayName('');
            setInviteRole('user');
            await loadData();
        } catch (error) {
            setInviteError(error instanceof Error ? error.message : 'Failed to create user');
        } finally {
            setInviteLoading(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const copyAllCredentials = async () => {
        if (!credentials) return;
        const text = `You're invited to Game Industry Insight!

Site: ${credentials.siteUrl}
Email: ${credentials.email}
Password: ${credentials.password}
Role: ${credentials.role}

Please login and change your password after first login.`;
        await navigator.clipboard.writeText(text);
        setCopiedField('all');
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleRoleChange = async (userId: string, newRole: UserRole, targetUser: AppUser) => {
        if (!isAdmin) return;
        if (userId === currentUser?.id) {
            alert('You cannot change your own role.');
            return;
        }

        // Only super admin can change admin roles
        if (targetUser.role === 'admin' && !isSuperAdmin) {
            alert('Only the super admin can modify other administrators.');
            return;
        }

        // Only super admin can promote to admin
        if (newRole === 'admin' && !isSuperAdmin) {
            alert('Only the super admin can promote users to admin.');
            return;
        }

        setActionLoading(userId);
        try {
            await updateUserRole(userId, newRole);
            await loadData();
        } catch (error) {
            console.error('Failed to update role:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser || !isAdmin) return;

        setResetPasswordLoading(true);
        try {
            const result = await resetUserPassword(resetPasswordUser.id);
            if (result.credentials) {
                setCredentials({
                    email: result.credentials.email,
                    password: result.credentials.password,
                    displayName: resetPasswordUser.display_name || '',
                    role: resetPasswordUser.role,
                    siteUrl: result.credentials.siteUrl
                });
                setShowCredentials(true);
            }
            setResetPasswordUser(null);
        } catch (error) {
            console.error('Failed to reset password:', error);
            alert('Failed to reset password. Please try again.');
        } finally {
            setResetPasswordLoading(false);
        }
    };

    // Check if current user can manage target user
    const canManageUser = (targetUser: AppUser): boolean => {
        if (!isAdmin) return false;
        if (targetUser.id === currentUser?.id) return false;

        // Super admin can manage everyone except themselves
        if (isSuperAdmin) return true;

        // Regular admins cannot manage other admins
        if (targetUser.role === 'admin') return false;

        return true;
    };

    const openDeleteConfirm = (user: AppUser) => {
        setDeleteConfirmUser(user);
        setDeleteEmailInput('');
        setDeleteError('');
    };

    const handleDeleteUser = async () => {
        if (!deleteConfirmUser || !isAdmin) return;

        if (deleteEmailInput !== deleteConfirmUser.email) {
            setDeleteError('Email does not match. Please type the exact email to confirm.');
            return;
        }

        setActionLoading(deleteConfirmUser.id);
        try {
            await deleteUser(deleteConfirmUser.id);
            setDeleteConfirmUser(null);
            setDeleteEmailInput('');
            await loadData();
        } catch (error) {
            console.error('Failed to delete user:', error);
            setDeleteError('Failed to delete user. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = allUsers.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isModerator) return null;

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                                        User Management
                                    </Dialog.Title>
                                    <Dialog.Description className="text-sm text-slate-500">
                                        Create users and manage permissions
                                    </Dialog.Description>
                                </div>
                            </div>
                            <Dialog.Close className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </Dialog.Close>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 px-6">
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('invite')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'invite'
                                        ? 'border-primary-600 text-primary-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Create User
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'all'
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                All Users
                                <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                                    {allUsers.length}
                                </span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'invite' && isAdmin ? (
                                <div className="max-w-md mx-auto">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                                            <UserPlus className="w-8 h-8 text-primary-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">Create a new user</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Create an account and share credentials with the user
                                        </p>
                                    </div>

                                    <form onSubmit={handleInvite} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Email address *
                                            </label>
                                            <input
                                                type="email"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                placeholder="colleague@company.com"
                                                required
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Display name
                                            </label>
                                            <input
                                                type="text"
                                                value={inviteDisplayName}
                                                onChange={(e) => setInviteDisplayName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                Role
                                            </label>
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                            >
                                                <option value="user">User</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>

                                        {inviteError && (
                                            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                                                {inviteError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={inviteLoading || !inviteEmail.trim()}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {inviteLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-4 h-4" />
                                                    Create User
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    <p className="text-xs text-slate-400 text-center mt-4">
                                        A random password will be generated. Share credentials with the user.
                                    </p>
                                </div>
                            ) : isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search users..."
                                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                                        />
                                    </div>

                                    {/* User List */}
                                    <div className="space-y-2">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                                            >
                                                <Link
                                                    href={`/profile/${user.id}`}
                                                    onClick={() => onOpenChange(false)}
                                                    className="flex items-center gap-3 group"
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:ring-2 group-hover:ring-primary-300 ${user.is_approved ? 'bg-primary-100' : 'bg-slate-100'
                                                        }`}>
                                                        <span className={`font-medium ${user.is_approved ? 'text-primary-700' : 'text-slate-500'
                                                            }`}>
                                                            {(user.display_name || user.email).charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-900 group-hover:text-primary-600 transition-colors">
                                                                {user.display_name || 'No name'}
                                                            </p>
                                                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <span className={`px-2 py-0.5 text-xs rounded-full border ${roleColors[user.role].bg} ${roleColors[user.role].text} ${roleColors[user.role].border}`}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </div>
                                                </Link>

                                                {canManageUser(user) && (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole, user)}
                                                            disabled={actionLoading === user.id}
                                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="moderator">Moderator</option>
                                                            {isSuperAdmin && <option value="admin">Admin</option>}
                                                        </select>
                                                        <button
                                                            onClick={() => setResetPasswordUser(user)}
                                                            disabled={actionLoading === user.id}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Reset password"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteConfirm(user)}
                                                            disabled={actionLoading === user.id}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Credentials Modal */}
            <Dialog.Root open={showCredentials} onOpenChange={setShowCredentials}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-[60] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-slate-900">
                                    User Created Successfully!
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-slate-500">
                                    Share these credentials with the user
                                </Dialog.Description>
                            </div>
                        </div>

                        {credentials && (
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Site</p>
                                            <a href={credentials.siteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                                                {credentials.siteUrl}
                                            </a>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(credentials.siteUrl, 'site')}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            {copiedField === 'site' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                                            <p className="text-sm font-mono text-slate-700">{credentials.email}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(credentials.email, 'email')}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            {copiedField === 'email' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Password</p>
                                            <p className="text-sm font-mono text-slate-700">{credentials.password}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(credentials.password, 'password')}
                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            {copiedField === 'password' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide">Role</p>
                                            <p className="text-sm text-slate-700 capitalize">{credentials.role}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={copyAllCredentials}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                >
                                    {copiedField === 'all' ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy All (for email/chat)
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-slate-400 text-center">
                                    ⚠️ This password will not be shown again. Make sure to share it securely.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowCredentials(false);
                                    setCredentials(null);
                                }}
                                className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Delete Confirmation Dialog */}
            <Dialog.Root open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-[60] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-slate-900">
                                    Delete User
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-slate-500">
                                    This action cannot be undone.
                                </Dialog.Description>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                To confirm deletion, please type the user's email address:
                            </p>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-mono text-slate-700">{deleteConfirmUser?.email}</p>
                            </div>
                            <input
                                type="email"
                                value={deleteEmailInput}
                                onChange={(e) => {
                                    setDeleteEmailInput(e.target.value);
                                    setDeleteError('');
                                }}
                                placeholder="Type email to confirm..."
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                            />
                            {deleteError && (
                                <p className="text-sm text-red-600">{deleteError}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setDeleteConfirmUser(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={actionLoading === deleteConfirmUser?.id || deleteEmailInput !== deleteConfirmUser?.email}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {actionLoading === deleteConfirmUser?.id ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Reset Password Confirmation Dialog */}
            <Dialog.Root open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-[60] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Key className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-slate-900">
                                    Reset Password
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-slate-500">
                                    Generate a new password for this user
                                </Dialog.Description>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to reset the password for:
                            </p>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-900">
                                    {resetPasswordUser?.display_name || 'No name'}
                                </p>
                                <p className="text-sm text-slate-500">{resetPasswordUser?.email}</p>
                            </div>
                            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                                ⚠️ A new random password will be generated. Make sure to share it securely with the user.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setResetPasswordUser(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={resetPasswordLoading}
                                className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}

export default UserManagementDialog;
