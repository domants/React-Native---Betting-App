-- Create function to update auth user ID
CREATE OR REPLACE FUNCTION update_auth_user_id(old_id uuid, new_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    email_addr text;
    raw_user_meta jsonb;
BEGIN
    -- Get the email and user metadata from the current auth user
    SELECT 
        email::text, 
        raw_user_meta_data::jsonb 
    INTO 
        email_addr, 
        raw_user_meta
    FROM auth.users
    WHERE id::uuid = old_id::uuid;

    -- Temporarily disable foreign key checks
    SET CONSTRAINTS ALL DEFERRED;

    -- First update the auth user
    UPDATE auth.users
    SET 
        id = new_id::uuid,
        updated_at = now(),
        last_sign_in_at = now()
    WHERE id::uuid = old_id::uuid;

    -- Then update all related tables
    UPDATE auth.identities
    SET 
        user_id = new_id::uuid,
        identity_data = jsonb_build_object(
            'sub', new_id::text,
            'email', email_addr::text
        ),
        updated_at = now()
    WHERE user_id::uuid = old_id::uuid;
    
    UPDATE auth.sessions
    SET user_id = new_id::uuid
    WHERE user_id::uuid = old_id::uuid;
    
    UPDATE auth.refresh_tokens
    SET user_id = new_id::uuid
    WHERE user_id::uuid = old_id::uuid;

    UPDATE audit_logs
    SET user_id = new_id::uuid
    WHERE user_id::uuid = old_id::uuid;

    -- Re-enable foreign key checks
    SET CONSTRAINTS ALL IMMEDIATE;
END;
$$; 