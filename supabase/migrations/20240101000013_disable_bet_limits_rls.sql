-- Disable RLS for bet_limits table since access is controlled at the application level
ALTER TABLE bet_limits DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can view bet limits" ON bet_limits;
DROP POLICY IF EXISTS "Only admins can manage bet limits" ON bet_limits;

-- Grant necessary permissions to authenticated users
GRANT ALL ON bet_limits TO authenticated; 