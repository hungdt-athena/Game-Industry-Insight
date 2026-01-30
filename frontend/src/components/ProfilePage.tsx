import { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import {
    User, Mail, Calendar, Shield, Heart, Bookmark, Users,
    ChevronRight, ArrowLeft, Edit2, Save, X, Clock, Lock, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    getSavedPosts,
    getFollowedAuthors,
    createNotification,
    type SavedPostData,
    type AppUser
} from '@/lib/queries-auth';

interface LikedPost {
    id: string;
    post_id: string;
    liked_at: string;
    post: {
        id: string;
        title: string;
        category_name: string | null;
    };
}

interface FollowedAuthor {
    id: string;
    followed_at: string;
    author: {
        id: string;
        name: string;
        avatar_url: string | null;
    };
}

// Get initials from display name (e.g., "Thinh Hung" -> "TH")
function getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export function ProfilePage() {
    useLocation(); // For route change detection
    const [matchProfile, params] = useRoute('/profile/:userId');
    const userId = matchProfile ? params?.userId : undefined;
    const { user: currentUser, isAdmin, isModerator } = useAuth();

    const [profileUser, setProfileUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [editDisplayName, setEditDisplayName] = useState('');

    // Password change state (only for own profile)
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Stats
    const [savedPosts, setSavedPosts] = useState<SavedPostData[]>([]);
    const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
    const [followedAuthors, setFollowedAuthors] = useState<FollowedAuthor[]>([]);

    // Tabs
    const [activeTab, setActiveTab] = useState<'saved' | 'liked' | 'following'>('saved');

    // Determine which user's profile to show
    const targetUserId = userId || currentUser?.id;
    const isOwnProfile = !userId || userId === currentUser?.id;
    const canEdit = isOwnProfile || isAdmin;
    const canView = isOwnProfile || isModerator || isAdmin;

    useEffect(() => {
        if (!targetUserId) return;
        loadProfile();
    }, [targetUserId]);

    const loadProfile = async () => {
        if (!targetUserId) return;

        setIsLoading(true);
        try {
            // Load user profile
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', targetUserId)
                .single();

            if (userError) throw userError;
            setProfileUser(userData);
            setEditDisplayName(userData.display_name || '');

            // Load saved posts
            const saved = await getSavedPosts(targetUserId);
            setSavedPosts(saved);

            // Load liked posts
            const { data: likedData } = await supabase
                .from('post_likes')
                .select(`
                    id,
                    post_id,
                    liked_at,
                    post:posts (
                        id,
                        title,
                        post_tags (
                            tag:tags (
                                name,
                                type
                            )
                        )
                    )
                `)
                .eq('user_id', targetUserId)
                .order('liked_at', { ascending: false });

            setLikedPosts((likedData || []).map((item: any) => ({
                id: item.id,
                post_id: item.post_id,
                liked_at: item.liked_at,
                post: {
                    id: item.post?.id,
                    title: item.post?.title,
                    category_name: item.post?.post_tags?.find((pt: any) => pt.tag?.type === 'CATEGORY')?.tag?.name || null,
                }
            })));

            // Load followed authors
            const followed = await getFollowedAuthors(targetUserId);
            setFollowedAuthors((followed || []).map((item: any) => ({
                id: item.id,
                followed_at: item.followed_at,
                author: item.author || { id: '', name: 'Unknown', avatar_url: null }
            })));

        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileUser || !canEdit) return;

        setIsSaving(true);
        try {
            // Track what changed for activity log
            const changes: Record<string, { old: any; new: any }> = {};

            // Check display name change
            const newDisplayName = editDisplayName.trim() || null;
            if (newDisplayName !== profileUser.display_name) {
                changes.display_name = { old: profileUser.display_name, new: newDisplayName };
            }

            const updates: any = {
                display_name: newDisplayName,
            };

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', profileUser.id);

            if (error) throw error;

            // Log the action if there were changes
            if (Object.keys(changes).length > 0) {
                await supabase.from('activity_logs').insert({
                    actor_id: currentUser?.id,
                    actor_email: currentUser?.email,
                    actor_role: isAdmin ? 'admin' : (isModerator ? 'moderator' : 'user'),
                    action_type: 'profile_update',
                    target_user_id: profileUser.id,
                    target_user_email: profileUser.email,
                    details: { changes, isOwnProfile }
                });

                // If admin is editing another user's profile, send notification
                if (!isOwnProfile && isAdmin) {
                    await createNotification(profileUser.id, {
                        type: 'profile_updated',
                        title: 'Your profile was updated',
                        message: 'An administrator has updated your profile information.',
                        metadata: { updatedBy: currentUser?.email, changes }
                    });
                }
            }

            setProfileUser(prev => prev ? { ...prev, ...updates } : null);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!isOwnProfile) return;

        setPasswordError('');

        // Validate
        if (!currentPassword) {
            setPasswordError('Current password is required');
            return;
        }
        if (!newPassword) {
            setPasswordError('New password is required');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            // Verify current password by re-authenticating
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: currentUser?.email || '',
                password: currentPassword
            });

            if (signInError) {
                setPasswordError('Current password is incorrect');
                setIsChangingPassword(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            // Log password change
            await supabase.from('activity_logs').insert({
                actor_id: currentUser?.id,
                actor_email: currentUser?.email,
                actor_role: isAdmin ? 'admin' : (isModerator ? 'moderator' : 'user'),
                action_type: 'password_change',
                target_user_id: currentUser?.id,
                target_user_email: currentUser?.email,
                details: { selfChange: true }
            });

            // Reset form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordChange(false);
            alert('Password changed successfully!');
        } catch (error) {
            console.error('Failed to change password:', error);
            setPasswordError('Failed to change password. Please try again.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!canView) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-500">You don't have permission to view this profile.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">User Not Found</h2>
                    <p className="text-slate-500">This user doesn't exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const roleColors: Record<string, { bg: string; text: string }> = {
        admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
        moderator: { bg: 'bg-blue-100', text: 'text-blue-700' },
        user: { bg: 'bg-slate-100', text: 'text-slate-600' },
    };

    const initials = getInitials(profileUser.display_name || profileUser.email.split('@')[0]);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    {/* Profile Info */}
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Avatar with Initials */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                                <span className="text-2xl font-bold text-white">
                                    {initials}
                                </span>
                            </div>

                            {/* Name & Role */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        {profileUser.display_name || 'No name'}
                                    </h1>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[profileUser.role].bg} ${roleColors[profileUser.role].text}`}>
                                        {profileUser.role}
                                    </span>
                                </div>
                                <p className="text-slate-500 flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4" />
                                    {profileUser.email}
                                </p>
                            </div>

                            {/* Edit Button */}
                            {canEdit && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {/* Edit Form */}
                        {isEditing && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                                <h3 className="font-medium text-slate-900 mb-4">Edit Profile</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editDisplayName}
                                            onChange={(e) => setEditDisplayName(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                            placeholder="Enter display name"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditDisplayName(profileUser.display_name || '');
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Password Change Section - Only for own profile */}
                        {isOwnProfile && (
                            <div className="mt-6">
                                {!showPasswordChange ? (
                                    <button
                                        onClick={() => setShowPasswordChange(true)}
                                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Change Password
                                    </button>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                                            <Lock className="w-4 h-4" />
                                            Change Password
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showCurrentPassword ? 'text' : 'password'}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                        placeholder="Enter current password"
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
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showNewPassword ? 'text' : 'password'}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                        placeholder="Enter new password"
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
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                            {passwordError && (
                                                <p className="text-sm text-red-600">{passwordError}</p>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleChangePassword}
                                                    disabled={isChangingPassword}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                                >
                                                    <Lock className="w-4 h-4" />
                                                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowPasswordChange(false);
                                                        setCurrentPassword('');
                                                        setNewPassword('');
                                                        setConfirmPassword('');
                                                        setPasswordError('');
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center justify-center gap-2 text-pink-600 mb-1">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{likedPosts.length}</p>
                                <p className="text-sm text-slate-500">Liked Posts</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center justify-center gap-2 text-amber-600 mb-1">
                                    <Bookmark className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{savedPosts.length}</p>
                                <p className="text-sm text-slate-500">Saved Posts</p>
                            </div>
                            <div className="text-center p-4 bg-slate-50 rounded-xl">
                                <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                                    <Users className="w-5 h-5" />
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{followedAuthors.length}</p>
                                <p className="text-sm text-slate-500">Following</p>
                            </div>
                        </div>

                        {/* Joined Date */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                            <Calendar className="w-4 h-4" />
                            Joined {formatDate(profileUser.created_at)}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Tab Headers */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === 'saved'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Bookmark className="w-4 h-4" />
                            Saved Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('liked')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === 'liked'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Heart className="w-4 h-4" />
                            Liked Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('following')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${activeTab === 'following'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Following
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'saved' && (
                            <div className="space-y-3">
                                {savedPosts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-500">No saved posts yet</p>
                                    </div>
                                ) : (
                                    savedPosts.map((item) => (
                                        <Link
                                            key={item.id}
                                            to={`/post/${item.post_id}`}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">
                                                    {item.post.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {item.post.category_name && (
                                                        <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                                                            {item.post.category_name}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(item.saved_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'liked' && (
                            <div className="space-y-3">
                                {likedPosts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-500">No liked posts yet</p>
                                    </div>
                                ) : (
                                    likedPosts.map((item) => (
                                        <Link
                                            key={item.id}
                                            to={`/post/${item.post_id}`}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate">
                                                    {item.post.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {item.post.category_name && (
                                                        <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">
                                                            {item.post.category_name}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(item.liked_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                        </Link>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'following' && (
                            <div className="space-y-3">
                                {followedAuthors.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-500">Not following any authors yet</p>
                                    </div>
                                ) : (
                                    followedAuthors.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                <span className="text-lg font-bold text-white">
                                                    {getInitials(item.author.name)}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{item.author.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    Following since {formatDate(item.followed_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
