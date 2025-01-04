-- Create draw_results table
CREATE TABLE IF NOT EXISTS draw_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draw_date DATE NOT NULL,
    draw_time TIME NOT NULL,
    l2_result VARCHAR(2) NOT NULL CHECK (l2_result ~ '^[0-9]{2}$'),
    d3_result VARCHAR(3) NOT NULL CHECK (d3_result ~ '^[0-9]{3}$')
);

-- Drop any existing triggers
DROP TRIGGER IF EXISTS update_draw_results_updated_at ON draw_results;
DROP TRIGGER IF EXISTS draw_results_audit_fields ON draw_results;

-- Add RLS policies
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "draw_results_select_policy" ON draw_results;
DROP POLICY IF EXISTS "draw_results_insert_policy" ON draw_results;
DROP POLICY IF EXISTS "draw_results_update_policy" ON draw_results;
DROP POLICY IF EXISTS "draw_results_delete_policy" ON draw_results;

-- Create policies
CREATE POLICY "draw_results_select_policy" 
    ON draw_results FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "draw_results_insert_policy" 
    ON draw_results FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'Admin'
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "draw_results_update_policy" 
    ON draw_results FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'Admin'
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "draw_results_delete_policy" 
    ON draw_results FOR DELETE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'Admin'
            AND deleted_at IS NULL
        )
    ); 