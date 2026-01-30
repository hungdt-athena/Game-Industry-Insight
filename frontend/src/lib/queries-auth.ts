import { supabase } from './supabase';
import type { AppUser } from './AuthContext';

// Re-export AppUser for convenience
export type { AppUser };

// =====================================================
// SAVED POSTS
// =====================================================

export interface SavedPostData {
    id: string;
    post_id: string;
    saved_at: string;
    post: {
        id: string;
        title: string;
        category_name: string | null;
    };
}

export async function getSavedPosts(userId: string): Promise<SavedPostData[]> {
    const { data, error } = await supabase
        .from('user_saved_posts')
        .select(`
            id,
            post_id,
            saved_at,
            post:posts (
                id,
                title,
                post_tags!inner (
                    tag:tags!inner (
                        name,
                        type
                    )
                )
            )
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
        id: item.id,
        post_id: item.post_id,
        saved_at: item.saved_at,
        post: {
            id: item.post?.id,
            title: item.post?.title,
            category_name: item.post?.post_tags?.find((pt: any) => pt.tag?.type === 'CATEGORY')?.tag?.name || null,
        },
    }));
}

export async function savePost(userId: string, postId: string) {
    const { error } = await supabase
        .from('user_saved_posts')
        .insert({ user_id: userId, post_id: postId });

    if (error) throw error;
}

export async function unsavePost(userId: string, postId: string) {
    const { error } = await supabase
        .from('user_saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

    if (error) throw error;
}

export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_saved_posts')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

// =====================================================
// POST LIKES
// =====================================================

export async function likePost(userId: string, postId: string) {
    const { error } = await supabase
        .from('post_likes')
        .insert({ user_id: userId, post_id: postId });

    if (error) throw error;
}

export async function unlikePost(userId: string, postId: string) {
    const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

    if (error) throw error;
}

export async function isPostLiked(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

export async function getPostLikeCount(postId: string): Promise<number> {
    const { count, error } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
}

// =====================================================
// AUTHOR FOLLOWS
// =====================================================

export async function followAuthor(userId: string, authorId: string) {
    const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: userId, author_id: authorId });

    if (error) throw error;
}

export async function unfollowAuthor(userId: string, authorId: string) {
    const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('author_id', authorId);

    if (error) throw error;
}

export async function isFollowingAuthor(userId: string, authorId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('author_id', authorId)
        .maybeSingle();

    if (error) throw error;
    return !!data;
}

export async function getFollowedAuthors(userId: string) {
    const { data, error } = await supabase
        .from('user_follows')
        .select(`
            id,
            followed_at,
            author:authors (
                id,
                name,
                avatar_url
            )
        `)
        .eq('follower_id', userId);

    if (error) throw error;
    return data || [];
}

// =====================================================
// USER MANAGEMENT (Admin/Moderator)
// =====================================================

export async function getPendingUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function approveUser(userId: string) {
    const { error } = await supabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);

    if (error) throw error;
}

export async function rejectUser(userId: string) {
    // Could also delete the user, depending on requirements
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
}

export async function updateUserRole(userId: string, role: 'admin' | 'moderator' | 'user') {
    // Get current user (actor) info
    const { data: { user: actor } } = await supabase.auth.getUser();
    const { data: actorProfile } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', actor?.id)
        .single();

    // Get target user info for notification and logging
    const { data: userData } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', userId)
        .single();

    const oldRole = userData?.role;

    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

    if (error) throw error;

    // Create notification for the user about role change
    if (oldRole && oldRole !== role) {
        await createNotification(userId, {
            type: 'role_change',
            title: 'Your role has been updated',
            message: `Your role has been changed from ${oldRole} to ${role}.`,
            metadata: { oldRole, newRole: role, changedBy: actor?.email }
        });

        // Log the action
        await supabase.from('activity_logs').insert({
            actor_id: actor?.id,
            actor_email: actor?.email || actorProfile?.email,
            actor_role: actorProfile?.role,
            action_type: 'role_change',
            target_user_id: userId,
            target_user_email: userData?.email,
            details: { oldRole, newRole: role }
        });
    }
}

export async function deleteUser(userId: string) {
    // Get current user (actor) info
    const { data: { user: actor } } = await supabase.auth.getUser();
    const { data: actorProfile } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', actor?.id)
        .single();

    // Get target user info for logging before deletion
    const { data: targetUser } = await supabase
        .from('users')
        .select('email, display_name, role')
        .eq('id', userId)
        .single();

    // Log the action BEFORE deleting (since we need target info)
    await supabase.from('activity_logs').insert({
        actor_id: actor?.id,
        actor_email: actor?.email || actorProfile?.email,
        actor_role: actorProfile?.role,
        action_type: 'user_delete',
        target_user_id: userId,
        target_user_email: targetUser?.email,
        details: {
            deletedUserDisplayName: targetUser?.display_name,
            deletedUserRole: targetUser?.role
        }
    });

    // Delete from public.users (cascade will handle related data)
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
    // Note: To fully delete auth.users, need Supabase admin API
    // or Supabase Edge Function with admin privileges
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    metadata: Record<string, any>;
    created_at: string;
    read_at: string | null;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error counting notifications:', error);
        return 0;
    }
    return count || 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) throw error;
}

export async function deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) throw error;
}

export async function createNotification(
    userId: string,
    notification: { type: string; title: string; message: string; metadata?: Record<string, any> }
): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata || {},
        });

    if (error) {
        console.error('Error creating notification:', error);
        // Don't throw - notification failure shouldn't break main operation
    }
}

interface InviteUserResult {
    success: boolean;
    message: string;
    credentials?: {
        email: string;
        password: string;
        displayName: string;
        role: string;
        siteUrl: string;
    };
}

export async function inviteUser(
    email: string,
    displayName?: string,
    role: 'admin' | 'moderator' | 'user' = 'user'
): Promise<InviteUserResult> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, displayName, role }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
    }

    return result;
}

// Super admin email - only this user can manage other admins
export const SUPER_ADMIN_EMAIL = 'hungdt@athena.studio';

export interface ResetPasswordResult {
    success: boolean;
    message: string;
    credentials?: {
        email: string;
        password: string;
        siteUrl: string;
    };
}

export async function resetUserPassword(userId: string): Promise<ResetPasswordResult> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
    }

    return result;
}

