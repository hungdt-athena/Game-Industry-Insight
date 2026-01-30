import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ClipboardList, Clock, ArrowRight, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface ActivityLog {
    id: string;
    actor_id: string | null;
    actor_email: string | null;
    actor_role: string | null;
    action_type: string;
    target_user_id: string | null;
    target_user_email: string | null;
    details: Record<string, any>;
    created_at: string;
}

interface ActivityLogsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const actionTypeLabels: Record<string, { label: string; color: string }> = {
    role_change: { label: 'Role Change', color: 'bg-blue-100 text-blue-700' },
    profile_update: { label: 'Profile Update', color: 'bg-green-100 text-green-700' },
    password_reset: { label: 'Password Reset', color: 'bg-amber-100 text-amber-700' },
    password_change: { label: 'Password Change', color: 'bg-orange-100 text-orange-700' },
    user_delete: { label: 'User Delete', color: 'bg-red-100 text-red-700' },
    user_create: { label: 'User Create', color: 'bg-purple-100 text-purple-700' },
};

export function ActivityLogsDialog({ open, onOpenChange }: ActivityLogsDialogProps) {
    const { isAdmin } = useAuth();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [page, setPage] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        if (open && isAdmin) {
            loadLogs();
        }
    }, [open, isAdmin, page, filterType]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (filterType !== 'all') {
                query = query.eq('action_type', filterType);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredLogs = logs.filter(log =>
    (log.actor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target_user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get short email (name part only)
    const getShortEmail = (email: string | null) => {
        if (!email) return 'System';
        const atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    };

    const renderLogContent = (log: ActivityLog) => {
        const actorName = getShortEmail(log.actor_email);
        const targetName = getShortEmail(log.target_user_email);
        const isSelfAction = log.actor_id === log.target_user_id;

        // Different rendering based on action type
        switch (log.action_type) {
            case 'role_change':
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-slate-700">
                            <span className="font-medium">role</span>:{' '}
                            <span className="text-slate-500">{log.details?.oldRole || '(none)'}</span>
                            <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                            <span className="text-slate-900 font-medium">{log.details?.newRole}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                            on user <span className="font-medium text-slate-700">{targetName}</span>
                            {' '}by <span className="font-medium text-slate-700">{actorName}</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">{log.actor_role}</span>
                        </div>
                    </div>
                );

            case 'profile_update':
                const changes = log.details?.changes || {};
                const changeEntries = Object.entries(changes);
                return (
                    <div className="space-y-2">
                        {changeEntries.map(([field, value]: [string, any]) => (
                            <div key={field} className="text-sm text-slate-700">
                                <span className="font-medium">{field}</span>:{' '}
                                <span className="text-slate-500">{value?.old || '(empty)'}</span>
                                <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                                <span className="text-slate-900 font-medium">{value?.new || '(empty)'}</span>
                            </div>
                        ))}
                        <div className="text-xs text-slate-500">
                            on user <span className="font-medium text-slate-700">{targetName}</span>
                            {' '}by <span className="font-medium text-slate-700">{isSelfAction ? 'themselves' : actorName}</span>
                            {!isSelfAction && <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">{log.actor_role}</span>}
                        </div>
                    </div>
                );

            case 'password_change':
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-slate-700">
                            Password changed
                        </div>
                        <div className="text-xs text-slate-500">
                            by <span className="font-medium text-slate-700">{actorName}</span>
                            {isSelfAction && ' (self)'}
                        </div>
                    </div>
                );

            case 'password_reset':
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-slate-700">
                            Password reset by admin
                        </div>
                        <div className="text-xs text-slate-500">
                            on user <span className="font-medium text-slate-700">{targetName}</span>
                            {' '}by <span className="font-medium text-slate-700">{actorName}</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">{log.actor_role}</span>
                        </div>
                    </div>
                );

            case 'user_create':
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-slate-700">
                            New user created: <span className="font-medium">{log.target_user_email}</span>
                            {log.details?.role && (
                                <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{log.details.role}</span>
                            )}
                        </div>
                        <div className="text-xs text-slate-500">
                            by <span className="font-medium text-slate-700">{actorName}</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">{log.actor_role}</span>
                        </div>
                    </div>
                );

            case 'user_delete':
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-slate-700">
                            User deleted: <span className="font-medium text-red-600">{log.target_user_email}</span>
                            {log.details?.deletedUserDisplayName && (
                                <span className="text-slate-500 ml-1">({log.details.deletedUserDisplayName})</span>
                            )}
                        </div>
                        <div className="text-xs text-slate-500">
                            by <span className="font-medium text-slate-700">{actorName}</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">{log.actor_role}</span>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-2">
                        <div className="text-sm text-slate-700">
                            {JSON.stringify(log.details)}
                        </div>
                        <div className="text-xs text-slate-500">
                            by <span className="font-medium text-slate-700">{actorName}</span>
                        </div>
                    </div>
                );
        }
    };

    if (!isAdmin) return null;

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-slate-900">
                                    Activity Logs
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-slate-500">
                                    View all admin and moderator actions
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close asChild>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by email or action..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value);
                                        setPage(0);
                                    }}
                                    className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 appearance-none bg-white"
                                >
                                    <option value="all">All Actions</option>
                                    <option value="role_change">Role Changes</option>
                                    <option value="profile_update">Profile Updates</option>
                                    <option value="password_reset">Password Resets</option>
                                    <option value="password_change">Password Changes</option>
                                    <option value="user_create">User Creates</option>
                                    <option value="user_delete">User Deletes</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500">No activity logs found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${actionTypeLabels[log.action_type]?.color || 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {actionTypeLabels[log.action_type]?.label || log.action_type}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        {renderLogContent(log)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <span className="text-sm text-slate-500">Page {page + 1}</span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={logs.length < pageSize}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

export default ActivityLogsDialog;
