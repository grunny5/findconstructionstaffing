-- Create RLS policies for junction tables
-- These policies ensure relationships are only visible for active agencies

-- Policy for agency_trades: Only show trades for active agencies
CREATE POLICY "Public can view active agency trades" ON agency_trades
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agencies 
            WHERE agencies.id = agency_trades.agency_id 
            AND agencies.is_active = true
        )
    );

-- Policy for agency_regions: Only show regions for active agencies
CREATE POLICY "Public can view active agency regions" ON agency_regions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agencies 
            WHERE agencies.id = agency_regions.agency_id 
            AND agencies.is_active = true
        )
    );

-- Verify junction table policies
DO $$
DECLARE
    policy_count INTEGER;
    total_policies INTEGER;
BEGIN
    -- Count policies on junction tables
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('agency_trades', 'agency_regions');
    
    -- Count total policies
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions');
    
    RAISE NOTICE 'Junction table policies created: %', policy_count;
    RAISE NOTICE 'Total RLS policies in system: %', total_policies;
END $$;

-- Add comments documenting the junction table policies
COMMENT ON POLICY "Public can view active agency trades" ON agency_trades IS 
    'Ensures trade relationships are only visible for active agencies';
COMMENT ON POLICY "Public can view active agency regions" ON agency_regions IS 
    'Ensures region relationships are only visible for active agencies';

-- Test query to demonstrate the policy effect
-- This query will only return relationships for active agencies
/*
Example query that users might run:
SELECT 
    a.name as agency_name,
    t.name as trade_name
FROM agencies a
JOIN agency_trades at ON a.id = at.agency_id
JOIN trades t ON at.trade_id = t.id
WHERE a.is_active = true;
*/