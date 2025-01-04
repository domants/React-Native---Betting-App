-- Drop ALL existing policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can create subordinates" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Admin can create users" ON users;
DROP POLICY IF EXISTS "Allow users to check their own role" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON users;
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "allow_read_users" ON users;
DROP POLICY IF EXISTS "allow_update_own_profile" ON users;
DROP POLICY IF EXISTS "allow_admin_all" ON users;
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for admins" ON users;
DROP POLICY IF EXISTS "Users can update own record or admin can update any" ON users;

-- Drop ALL existing policies for other tables
DROP POLICY IF EXISTS "Users can view their own bets" ON bets;
DROP POLICY IF EXISTS "Users can create their own bets" ON bets;
DROP POLICY IF EXISTS "Admins can view all bets" ON bets;
DROP POLICY IF EXISTS "Coordinators can view subordinate bets" ON bets;
DROP POLICY IF EXISTS "Anyone can view draw results" ON draw_results;
DROP POLICY IF EXISTS "Only admins can manage draw results" ON draw_results;
DROP POLICY IF EXISTS "Anyone can view bet limits" ON bet_limits;
DROP POLICY IF EXISTS "Only admins can manage bet limits" ON bet_limits;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can manage all payouts" ON payouts;
DROP POLICY IF EXISTS "Coordinators can view subordinate payouts" ON payouts;
DROP POLICY IF EXISTS "Users can view their own hierarchy" ON user_hierarchy;
DROP POLICY IF EXISTS "Admins can manage hierarchy" ON user_hierarchy;

-- Create or replace admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'Admin'
  );
$$;

-- Create Users table policies
CREATE POLICY "users_read_policy"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "users_update_policy"
    ON users FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    )
    WITH CHECK (
        auth.uid() = id 
        OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );

CREATE POLICY "users_insert_policy"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );

CREATE POLICY "users_delete_policy"
    ON users FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'Admin'
        )
    );

-- Create Bets table policies
CREATE POLICY "Users can view their own bets"
    ON bets FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bets"
    ON bets FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all bets"
    ON bets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    ));

CREATE POLICY "Coordinators can view subordinate bets"
    ON bets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_hierarchy
        WHERE parent_id = auth.uid()
        AND child_id = bets.user_id
    ));

-- Create Draw Results table policies
CREATE POLICY "Anyone can view draw results"
    ON draw_results FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage draw results"
    ON draw_results FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    ));

-- Create Bet Limits table policies
CREATE POLICY "Anyone can view bet limits"
    ON bet_limits FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage bet limits"
    ON bet_limits FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    ));

-- Create Audit Logs table policies
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    ));

CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- Create Payouts table policies
CREATE POLICY "Users can view their own payouts"
    ON payouts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payouts"
    ON payouts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    ));

CREATE POLICY "Coordinators can view subordinate payouts"
    ON payouts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_hierarchy
        WHERE parent_id = auth.uid()
        AND child_id = payouts.user_id
    ));

-- Create User Hierarchy table policies
CREATE POLICY "Users can view their own hierarchy"
    ON user_hierarchy FOR SELECT
    USING (parent_id = auth.uid() OR child_id = auth.uid());

CREATE POLICY "Admins can manage hierarchy"
    ON user_hierarchy FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
    ));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;