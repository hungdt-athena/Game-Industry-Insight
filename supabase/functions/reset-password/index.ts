import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
    userId: string
}

// Generate a random password
function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
        password += chars[array[i] % chars.length]
    }
    return password
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Verify requesting user is admin
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid user token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await userClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile || profile.role !== 'admin') {
            return new Response(
                JSON.stringify({ error: 'Only admins can reset passwords' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse request
        const { userId }: ResetPasswordRequest = await req.json()

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'User ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get target user info
        const { data: targetUser, error: targetError } = await adminClient.auth.admin.getUserById(userId)
        if (targetError || !targetUser) {
            return new Response(
                JSON.stringify({ error: 'User not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate new password
        const newPassword = generatePassword(12)

        // Update user password
        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (updateError) {
            console.error('Update password error:', updateError)
            return new Response(
                JSON.stringify({ error: updateError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Log the password reset action
        await adminClient.from('activity_logs').insert({
            actor_id: user.id,
            actor_email: user.email,
            actor_role: profile?.role,
            action_type: 'password_reset',
            target_user_id: userId,
            target_user_email: targetUser.user.email,
            details: {}
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Password reset successfully',
                credentials: {
                    email: targetUser.user.email,
                    password: newPassword,
                    siteUrl: 'https://game-industry-insight.replit.app/'
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
