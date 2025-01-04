-- First drop any existing policies
DROP POLICY IF EXISTS "Allow all operations for admins" ON draw_results;
DROP POLICY IF EXISTS "Allow admins to select draw results" ON draw_results;
DROP POLICY IF EXISTS "Allow admins to insert draw results" ON draw_results;
DROP POLICY IF EXISTS "Allow admins to update draw results" ON draw_results;
DROP POLICY IF EXISTS "Allow admins to delete draw results" ON draw_results;
DROP POLICY IF EXISTS "admin_all_access" ON draw_results;
DROP POLICY IF EXISTS "select_draw_results" ON draw_results;
DROP POLICY IF EXISTS "insert_draw_results" ON draw_results;
DROP POLICY IF EXISTS "update_draw_results" ON draw_results;
DROP POLICY IF EXISTS "delete_draw_results" ON draw_results;
DROP POLICY IF EXISTS "admin_full_access" ON draw_results;
DROP POLICY IF EXISTS "draw_results_select_policy" ON draw_results;
DROP POLICY IF EXISTS "draw_results_insert_policy" ON draw_results;
DROP POLICY IF EXISTS "draw_results_update_policy" ON draw_results;
DROP POLICY IF EXISTS "draw_results_delete_policy" ON draw_results;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS draw_results_debug ON draw_results;
DROP FUNCTION IF EXISTS debug_draw_results();

-- Disable RLS since we're controlling access at the application level
ALTER TABLE draw_results DISABLE ROW LEVEL SECURITY;

-- First, drop the foreign key constraints
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_draw_date_fkey;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_draw_date_fkey;
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_draw_date_time_fkey;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_draw_date_time_fkey;

-- Drop existing constraints
ALTER TABLE draw_results DROP CONSTRAINT IF EXISTS unique_draw_date_time;
ALTER TABLE draw_results DROP CONSTRAINT IF EXISTS draw_results_draw_date_key;

-- Add unique constraint for draw_date and draw_time combination
ALTER TABLE draw_results ADD CONSTRAINT unique_draw_date_time UNIQUE (draw_date, draw_time);

-- Add draw_result_id column to bets and payouts tables if they don't exist
DO $$ 
BEGIN
    -- Add draw_result_id to bets table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bets' AND column_name = 'draw_result_id'
    ) THEN
        ALTER TABLE bets ADD COLUMN draw_result_id UUID;
        -- Update existing records to match draw_results
        UPDATE bets b 
        SET draw_result_id = dr.id 
        FROM draw_results dr 
        WHERE b.draw_date = dr.draw_date;
        -- Make draw_result_id not nullable after update
        ALTER TABLE bets ALTER COLUMN draw_result_id SET NOT NULL;
    END IF;

    -- Add draw_result_id to payouts table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payouts' AND column_name = 'draw_result_id'
    ) THEN
        ALTER TABLE payouts ADD COLUMN draw_result_id UUID;
        -- Update existing records to match draw_results
        UPDATE payouts p 
        SET draw_result_id = dr.id 
        FROM draw_results dr 
        WHERE p.draw_date = dr.draw_date;
        -- Make draw_result_id not nullable after update
        ALTER TABLE payouts ALTER COLUMN draw_result_id SET NOT NULL;
    END IF;
END $$;

-- Recreate the foreign key constraints to reference draw_result_id
ALTER TABLE bets 
  ADD CONSTRAINT bets_draw_result_id_fkey 
  FOREIGN KEY (draw_result_id) 
  REFERENCES draw_results(id);

ALTER TABLE payouts 
  ADD CONSTRAINT payouts_draw_result_id_fkey 
  FOREIGN KEY (draw_result_id) 
  REFERENCES draw_results(id);

-- Grant necessary privileges to authenticated users
GRANT ALL ON draw_results TO authenticated; 