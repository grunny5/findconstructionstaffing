-- Enable Row Level Security (RLS) on all tables
-- This secures tables by default - no access without explicit policies

-- Enable RLS on core tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on junction tables
ALTER TABLE agency_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_regions ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
DECLARE
    rls_count INTEGER;
    total_tables INTEGER := 5;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions')
    AND rowsecurity = true;
    
    IF rls_count = total_tables THEN
        RAISE NOTICE 'Success: RLS enabled on all % tables', total_tables;
    ELSE
        RAISE WARNING 'Warning: RLS only enabled on % of % tables', rls_count, total_tables;
    END IF;
END $$;

-- Add comments documenting the security model
COMMENT ON TABLE agencies IS 'Construction staffing agencies directory - RLS ENABLED';
COMMENT ON TABLE trades IS 'Construction trade specialties - RLS ENABLED';
COMMENT ON TABLE regions IS 'Service regions for agencies - RLS ENABLED';
COMMENT ON TABLE agency_trades IS 'Junction table: agencies <-> trades - RLS ENABLED';
COMMENT ON TABLE agency_regions IS 'Junction table: agencies <-> regions - RLS ENABLED';

-- Important note: After this migration, tables will be inaccessible 
-- until policies are created in the next migration!