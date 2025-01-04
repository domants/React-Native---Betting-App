-- Add deleted_at column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "admin_update_policy" ON users;
DROP POLICY IF EXISTS "self_update_policy" ON users;
DROP POLICY IF EXISTS "admin_insert_policy" ON users;

-- Drop user hierarchy policies
DROP POLICY IF EXISTS "hierarchy_read_policy" ON user_hierarchy;
DROP POLICY IF EXISTS "hierarchy_insert_policy" ON user_hierarchy;
DROP POLICY IF EXISTS "hierarchy_update_policy" ON user_hierarchy;
DROP POLICY IF EXISTS "hierarchy_delete_policy" ON user_hierarchy;

-- Create base read policy
CREATE POLICY "users_read_policy"
    ON users FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL  -- Only show non-deleted users
    );

-- Create admin update policy
CREATE POLICY "admin_update_policy"
    ON users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.email = auth.email()
            AND users.role = 'Admin'
            AND users.deleted_at IS NULL
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.email = auth.email()
            AND users.role = 'Admin'
            AND users.deleted_at IS NULL
        )
    );

-- Create self-update policy
CREATE POLICY "self_update_policy"
    ON users FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id
        AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.uid() = id
        AND deleted_at IS NULL
    );

-- Create insert policy for admins and authorized users
CREATE POLICY "users_insert_policy"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = auth.email()
            AND u.deleted_at IS NULL
            AND (
                -- Admin can create any user
                u.role = 'Admin'
                OR
                -- Coordinator can create Sub-Coordinator and Usher
                (u.role = 'Coordinator' AND (SELECT role) IN ('Sub-Coordinator', 'Usher'))
                OR
                -- Sub-Coordinator can create Usher
                (u.role = 'Sub-Coordinator' AND (SELECT role) = 'Usher')
            )
        )
    );

-- Create user hierarchy policies
CREATE POLICY "hierarchy_read_policy"
    ON user_hierarchy FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "hierarchy_insert_policy"
    ON user_hierarchy FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = auth.email()
            AND u.deleted_at IS NULL
            AND (
                u.role = 'Admin'
                OR
                (u.role = 'Coordinator' AND EXISTS (
                    SELECT 1 FROM users sub
                    WHERE sub.id = user_hierarchy.child_id
                    AND sub.role IN ('Sub-Coordinator', 'Usher')
                ))
                OR
                (u.role = 'Sub-Coordinator' AND EXISTS (
                    SELECT 1 FROM users sub
                    WHERE sub.id = user_hierarchy.child_id
                    AND sub.role = 'Usher'
                ))
            )
        )
    );

CREATE POLICY "hierarchy_update_policy"
    ON user_hierarchy FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = auth.email()
            AND u.role = 'Admin'
            AND u.deleted_at IS NULL
        )
    );

CREATE POLICY "hierarchy_delete_policy"
    ON user_hierarchy FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = auth.email()
            AND u.role = 'Admin'
            AND u.deleted_at IS NULL
        )
    );

-- Update parent_id foreign key to handle deleted users
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_parent_id_fkey,
ADD CONSTRAINT users_parent_id_fkey 
    FOREIGN KEY (parent_id) 
    REFERENCES users(id)
    ON DELETE SET NULL;  -- Set parent_id to null when parent is deleted

-- Function to soft delete users
CREATE OR REPLACE FUNCTION soft_delete_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Set deleted_at timestamp
    UPDATE users 
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
    
    -- Set parent_id to null for all children
    UPDATE users 
    SET parent_id = NULL
    WHERE parent_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for soft deletion
DROP TRIGGER IF EXISTS user_soft_delete ON users;
CREATE TRIGGER user_soft_delete
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete_user();

-- Create view for active users
CREATE OR REPLACE VIEW active_users AS
SELECT id, email, name, role
FROM users
WHERE deleted_at IS NULL
ORDER BY name;

-- Grant access to the view
GRANT SELECT ON active_users TO authenticated; 

-- Create delete policy for admins
CREATE POLICY "users_delete_policy"
    ON users FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = auth.email()
            AND u.role = 'Admin'
            AND u.deleted_at IS NULL
        )
    ); 