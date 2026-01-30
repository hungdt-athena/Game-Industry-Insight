import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
    email: string
    displayName?: string
    role?: 'admin' | 'moderator' | 'user'
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
                JSON.stringify({ error: 'Only admins can create users' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse request
        const { email, displayName, role = 'user' }: CreateUserRequest = await req.json()

        if (!email) {
            return new Response(
                JSON.stringify({ error: 'Email is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate random password
        const password = generatePassword(12)

        // Create admin client
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Create user with password directly
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                display_name: displayName || email.split('@')[0],
            },
        })

        if (createError) {
            console.error('Create user error:', createError)
            return new Response(
                JSON.stringify({ error: createError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Update user role and is_approved in public.users table
        // The trigger should create the user, but we need to update role
        const { error: updateError } = await adminClient
            .from('users')
            .update({
                role: role,
                is_approved: true,
                display_name: displayName || email.split('@')[0]
            })
            .eq('id', newUser.user.id)

        if (updateError) {
            console.error('Update user error:', updateError)
            // User was created but role update failed - not critical
        }

        // Try to send welcome email via SMTP2GO (free 1000 emails/month, no domain needed)
        const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY')
        const senderEmail = Deno.env.get('SENDER_EMAIL') || 'noreply@example.com'
        let emailSent = false

        if (smtp2goApiKey) {
            try {
                const siteUrl = 'https://game-industry-insight.replit.app/'
                const emailHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 20px;">Welcome to Game Industry Insight!</h1>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                            Your account has been created. Here are your login credentials:
                        </p>
                        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <p style="margin: 8px 0;"><strong>Site:</strong> <a href="${siteUrl}">${siteUrl}</a></p>
                            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
                            <p style="margin: 8px 0;"><strong>Role:</strong> ${role}</p>
                        </div>
                        <p style="color: #64748b; font-size: 14px;">
                            Please change your password after logging in for security.
                        </p>
                        <a href="${siteUrl}login" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
                            Login Now
                        </a>
                    </div>
                `

                // Send via SMTP2GO API
                const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: smtp2goApiKey,
                        to: [`<${email}>`],
                        sender: `Game Industry Insight <${senderEmail}>`,
                        subject: 'Welcome to Game Industry Insight - Your Account Credentials',
                        html_body: emailHtml,
                    }),
                })

                const result = await emailResponse.json()

                if (result.data?.succeeded > 0) {
                    emailSent = true
                    console.log('Welcome email sent to:', email)
                } else {
                    console.error('Failed to send email:', result)
                }
            } catch (emailError) {
                console.error('Email sending error:', emailError)
                // Don't fail the request if email fails
            }
        }

        // Log the user creation action
        await adminClient.from('activity_logs').insert({
            actor_id: user.id,
            actor_email: user.email,
            actor_role: profile?.role,
            action_type: 'user_create',
            target_user_id: newUser.user.id,
            target_user_email: email,
            details: {
                displayName: displayName || email.split('@')[0],
                role: role,
                emailSent
            }
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: `User created successfully${emailSent ? ' and welcome email sent' : ''}`,
                emailSent,
                credentials: {
                    email: email,
                    password: password,
                    displayName: displayName || email.split('@')[0],
                    role: role,
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
