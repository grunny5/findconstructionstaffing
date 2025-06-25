-- Create public read policies for anonymous access
-- These policies allow the public directory to function

-- Policy for agencies table: Only show active agencies
CREATE POLICY "Public can view active agencies" ON agencies
    FOR SELECT
    USING (is_active = true);

-- Policy for trades table: All trades are public
CREATE POLICY "Public can view all trades" ON trades
    FOR SELECT
    USING (true);

-- Policy for regions table: All regions are public
CREATE POLICY "Public can view all regions" ON regions
    FOR SELECT
    USING (true);

-- Note: Junction table policies will be created in Task 3.3
-- They require special handling to check parent agency status

-- Verify policies are created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('agencies', 'trades', 'regions');
    
    RAISE NOTICE 'Created % public read policies', policy_count;
END $$;

-- Add comments documenting the policies
COMMENT ON POLICY "Public can view active agencies" ON agencies IS 
    'Allows anonymous users to read active agencies for the public directory';
COMMENT ON POLICY "Public can view all trades" ON trades IS 
    'Allows anonymous users to read all trade specialties for filtering';
COMMENT ON POLICY "Public can view all regions" ON regions IS 
    'Allows anonymous users to read all regions for filtering';