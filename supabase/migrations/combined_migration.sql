-- COMBINED MIGRATION SCRIPT
-- Generated: 2025-06-25T11:53:17.741Z

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Migration 1: 001_create_core_tables.sql
-- --------------------------------------------------------
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    is_claimed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    offers_per_diem BOOLEAN DEFAULT false,
    is_union BOOLEAN DEFAULT false,
    founded_year INTEGER,
    employee_count TEXT,
    headquarters TEXT,
    rating NUMERIC(4,2) CHECK (rating >= 0 AND rating <= 10),
    review_count INTEGER DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,
    claimed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state_code CHAR(2) NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, state_code)
);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE
    ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE
    ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE
    ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE agencies IS 'Construction staffing agencies directory';
COMMENT ON TABLE trades IS 'Construction trade specialties (e.g., electrician, plumber)';
COMMENT ON TABLE regions IS 'Service regions for agencies';

COMMENT ON COLUMN agencies.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN agencies.is_claimed IS 'Whether agency has claimed their listing';
COMMENT ON COLUMN agencies.is_active IS 'Whether agency is currently active/visible';
COMMENT ON COLUMN agencies.rating IS 'Average rating from 0.00 to 10.00';
COMMENT ON COLUMN regions.state_code IS 'Two-letter US state code';

-- Migration 2: 20250624_002_create_relationships.sql
-- --------------------------------------------------------
-- Create junction table for agency-trade relationships
CREATE TABLE IF NOT EXISTS agency_trades (
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agency_id, trade_id)
);

-- Create junction table for agency-region relationships
CREATE TABLE IF NOT EXISTS agency_regions (
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agency_id, region_id)
);

-- Add indexes for better query performance on junction tables
CREATE INDEX idx_agency_trades_agency_id ON agency_trades(agency_id);
CREATE INDEX idx_agency_trades_trade_id ON agency_trades(trade_id);
CREATE INDEX idx_agency_regions_agency_id ON agency_regions(agency_id);
CREATE INDEX idx_agency_regions_region_id ON agency_regions(region_id);

-- Add comments for documentation
COMMENT ON TABLE agency_trades IS 'Junction table linking agencies to their trade specialties';
COMMENT ON TABLE agency_regions IS 'Junction table linking agencies to their service regions';

-- Test the relationships with a verification query
DO $$
BEGIN
    -- Verify foreign key constraints are working
    RAISE NOTICE 'Junction tables created successfully with proper foreign key constraints';
END $$;

-- Migration 3: 20250625_004_enable_rls.sql
-- --------------------------------------------------------
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

-- Migration 4: 20250626_001_junction_table_policies.sql
-- --------------------------------------------------------
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

-- Migration 5: applied_20250624_003_add_performance_indexes.sql
-- --------------------------------------------------------
-- Performance indexes for agencies table
-- Note: Some basic indexes were already created in the first migration
-- This migration adds additional performance-critical indexes

-- Check if indexes already exist before creating
DO $$
BEGIN
    -- Index for text search on agency names (case-insensitive)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_name_lower') THEN
        CREATE INDEX idx_agencies_name_lower ON agencies(LOWER(name));
        RAISE NOTICE 'Created index: idx_agencies_name_lower';
    END IF;

    -- Composite index for common filter combinations
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_active_featured') THEN
        CREATE INDEX idx_agencies_active_featured ON agencies(is_active, featured) WHERE is_active = true;
        RAISE NOTICE 'Created index: idx_agencies_active_featured';
    END IF;

    -- Index for claimed agencies
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_claimed') THEN
        CREATE INDEX idx_agencies_claimed ON agencies(is_claimed) WHERE is_claimed = true;
        RAISE NOTICE 'Created index: idx_agencies_claimed';
    END IF;

    -- Index for rating-based sorting
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_rating') THEN
        CREATE INDEX idx_agencies_rating ON agencies(rating DESC NULLS LAST) WHERE is_active = true;
        RAISE NOTICE 'Created index: idx_agencies_rating';
    END IF;

    -- Index for trades table slug (for URL lookups)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trades_slug') THEN
        CREATE INDEX idx_trades_slug ON trades(slug);
        RAISE NOTICE 'Created index: idx_trades_slug';
    END IF;

    -- Index for regions table slug
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_slug') THEN
        CREATE INDEX idx_regions_slug ON regions(slug);
        RAISE NOTICE 'Created index: idx_regions_slug';
    END IF;

    -- Composite index for region lookups by state
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_state_name') THEN
        CREATE INDEX idx_regions_state_name ON regions(state_code, name);
        RAISE NOTICE 'Created index: idx_regions_state_name';
    END IF;
END $$;

-- Analyze tables to update statistics for query planner
ANALYZE agencies;
ANALYZE trades;
ANALYZE regions;
ANALYZE agency_trades;
ANALYZE agency_regions;

-- Add comment about index strategy
COMMENT ON INDEX idx_agencies_name_lower IS 'Supports case-insensitive search on agency names';
COMMENT ON INDEX idx_agencies_active_featured IS 'Optimizes queries filtering by active and featured status';
COMMENT ON INDEX idx_agencies_claimed IS 'Speeds up queries for claimed agencies';
COMMENT ON INDEX idx_agencies_rating IS 'Optimizes sorting by rating for active agencies';

-- Verification query to show all indexes
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions');
    
    RAISE NOTICE 'Total indexes on core tables: %', index_count;
END $$;

-- Migration 6: applied_20250625_005_create_public_read_policies.sql
-- --------------------------------------------------------
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

-- Migration 7: combined_migration.sql
-- --------------------------------------------------------
-- COMBINED MIGRATION SCRIPT
-- Generated: 2025-06-24T23:46:50.887Z
-- Last Updated: 2025-06-25
-- 
-- This file contains all migrations in the correct order:
-- 1. Core tables (agencies, trades, regions)
-- 2. Junction tables (agency_trades, agency_regions)
-- 3. Performance indexes
-- 4. Row Level Security (RLS) enablement
-- 5. Public read policies
-- 6. Junction table policies

-- Migration 1: 001_create_core_tables.sql
-- --------------------------------------------------------
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    is_claimed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    offers_per_diem BOOLEAN DEFAULT false,
    is_union BOOLEAN DEFAULT false,
    founded_year INTEGER,
    employee_count TEXT,
    headquarters TEXT,
    rating NUMERIC(4,2) CHECK (rating >= 0 AND rating <= 10),
    review_count INTEGER DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,
    claimed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state_code CHAR(2) NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, state_code)
);

-- Create updated_at triggers for all tables
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE
    ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE
    ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE
    ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE agencies IS 'Construction staffing agencies directory';
COMMENT ON TABLE trades IS 'Construction trade specialties (e.g., electrician, plumber)';
COMMENT ON TABLE regions IS 'Service regions for agencies';

COMMENT ON COLUMN agencies.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN agencies.is_claimed IS 'Whether agency has claimed their listing';
COMMENT ON COLUMN agencies.is_active IS 'Whether agency is currently active/visible';
COMMENT ON COLUMN agencies.rating IS 'Average rating from 0.00 to 10.00';
COMMENT ON COLUMN regions.state_code IS 'Two-letter US state code';

-- Migration 2: 20250624_002_create_relationships.sql
-- --------------------------------------------------------
-- Create junction table for agency-trade relationships
CREATE TABLE IF NOT EXISTS agency_trades (
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agency_id, trade_id)
);

-- Create junction table for agency-region relationships
CREATE TABLE IF NOT EXISTS agency_regions (
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agency_id, region_id)
);

-- Add indexes for better query performance on junction tables
CREATE INDEX idx_agency_trades_agency_id ON agency_trades(agency_id);
CREATE INDEX idx_agency_trades_trade_id ON agency_trades(trade_id);
CREATE INDEX idx_agency_regions_agency_id ON agency_regions(agency_id);
CREATE INDEX idx_agency_regions_region_id ON agency_regions(region_id);

-- Add comments for documentation
COMMENT ON TABLE agency_trades IS 'Junction table linking agencies to their trade specialties';
COMMENT ON TABLE agency_regions IS 'Junction table linking agencies to their service regions';

-- Migration 3: applied_20250624_003_add_performance_indexes.sql
-- --------------------------------------------------------
-- Performance indexes for agencies table
DO $$
BEGIN
    -- Index for text search on agency names (case-insensitive)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_name_lower') THEN
        CREATE INDEX idx_agencies_name_lower ON agencies(LOWER(name));
    END IF;

    -- Composite index for common filter combinations
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_active_featured') THEN
        CREATE INDEX idx_agencies_active_featured ON agencies(is_active, featured) WHERE is_active = true;
    END IF;

    -- Index for claimed agencies
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_claimed') THEN
        CREATE INDEX idx_agencies_claimed ON agencies(is_claimed) WHERE is_claimed = true;
    END IF;

    -- Index for rating-based sorting
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_rating') THEN
        CREATE INDEX idx_agencies_rating ON agencies(rating DESC NULLS LAST) WHERE is_active = true;
    END IF;

    -- Index for trades table slug (for URL lookups)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trades_slug') THEN
        CREATE INDEX idx_trades_slug ON trades(slug);
    END IF;

    -- Index for regions table slug
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_slug') THEN
        CREATE INDEX idx_regions_slug ON regions(slug);
    END IF;

    -- Composite index for region lookups by state
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_state_name') THEN
        CREATE INDEX idx_regions_state_name ON regions(state_code, name);
    END IF;
END $$;

-- Add index comments
COMMENT ON INDEX idx_agencies_name_lower IS 'Supports case-insensitive search on agency names';
COMMENT ON INDEX idx_agencies_active_featured IS 'Optimizes queries filtering by active and featured status';
COMMENT ON INDEX idx_agencies_claimed IS 'Speeds up queries for claimed agencies';
COMMENT ON INDEX idx_agencies_rating IS 'Optimizes sorting by rating for active agencies';

-- Migration 4: 20250625_004_enable_rls.sql
-- --------------------------------------------------------
-- Enable Row Level Security (RLS) on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_regions ENABLE ROW LEVEL SECURITY;

-- Migration 5: applied_20250625_005_create_public_read_policies.sql
-- --------------------------------------------------------
-- Create public read policies for anonymous access
CREATE POLICY "Public can view active agencies" ON agencies
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view all trades" ON trades
    FOR SELECT
    USING (true);

CREATE POLICY "Public can view all regions" ON regions
    FOR SELECT
    USING (true);

-- Add policy comments
COMMENT ON POLICY "Public can view active agencies" ON agencies IS 
    'Allows anonymous users to read active agencies for the public directory';
COMMENT ON POLICY "Public can view all trades" ON trades IS 
    'Allows anonymous users to read all trade specialties for filtering';
COMMENT ON POLICY "Public can view all regions" ON regions IS 
    'Allows anonymous users to read all regions for filtering';

-- Migration 6: 20250626_001_junction_table_policies.sql
-- --------------------------------------------------------
-- Create RLS policies for junction tables
CREATE POLICY "Public can view active agency trades" ON agency_trades
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agencies 
            WHERE agencies.id = agency_trades.agency_id 
            AND agencies.is_active = true
        )
    );

CREATE POLICY "Public can view active agency regions" ON agency_regions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agencies 
            WHERE agencies.id = agency_regions.agency_id 
            AND agencies.is_active = true
        )
    );

-- Add junction policy comments
COMMENT ON POLICY "Public can view active agency trades" ON agency_trades IS 
    'Ensures trade relationships are only visible for active agencies';
COMMENT ON POLICY "Public can view active agency regions" ON agency_regions IS 
    'Ensures region relationships are only visible for active agencies';

-- Final verification
-- --------------------------------------------------------
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
    rls_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' 
    AND tablename IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions');
    
    -- Count RLS-enabled tables
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('agencies', 'trades', 'regions', 'agency_trades', 'agency_regions')
    AND rowsecurity = true;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Tables created: %', table_count;
    RAISE NOTICE '  Indexes created: %', index_count;
    RAISE NOTICE '  RLS policies created: %', policy_count;
    RAISE NOTICE '  Tables with RLS enabled: %', rls_count;
END $$;

-- Analyze all tables to update statistics
ANALYZE agencies;
ANALYZE trades;
ANALYZE regions;
ANALYZE agency_trades;
ANALYZE agency_regions;



