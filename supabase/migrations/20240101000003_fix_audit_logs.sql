-- Drop all existing audit-related objects
DROP TRIGGER IF EXISTS users_audit ON users;
DROP TRIGGER IF EXISTS bets_audit ON bets;
DROP TRIGGER IF EXISTS draw_results_audit ON draw_results;
DROP TRIGGER IF EXISTS audit_draw_results_trigger ON draw_results;
DROP FUNCTION IF EXISTS log_audit();
DROP FUNCTION IF EXISTS audit_trigger_func();
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert the audit log
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id
    )
    VALUES (
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' 
            THEN row_to_json(OLD)::jsonb 
            ELSE NULL 
        END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' 
            THEN row_to_json(NEW)::jsonb 
            ELSE NULL 
        END,
        auth.uid()
    );

    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all tables that need auditing
CREATE TRIGGER users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER bets_audit
    AFTER INSERT OR UPDATE OR DELETE ON bets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER draw_results_audit
    AFTER INSERT OR UPDATE OR DELETE ON draw_results
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON audit_logs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'Admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON audit_logs TO authenticated; 