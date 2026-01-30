-- Activity Logs Schema
-- Stores all admin/mod actions for auditing

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who performed the action
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    
    -- What action was performed
    action_type TEXT NOT NULL, -- 'role_change', 'profile_update', 'password_reset', 'user_delete', 'user_create', etc.
    
    -- Target of the action (if applicable)
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_email TEXT,
    
    -- Details of the action
    details JSONB DEFAULT '{}',
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_user_id ON activity_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only service role can insert logs (from Edge Functions)
CREATE POLICY "Service role can insert logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON activity_logs TO authenticated;
GRANT INSERT ON activity_logs TO service_role;
