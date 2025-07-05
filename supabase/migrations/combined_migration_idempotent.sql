-- COMBINED MIGRATION SCRIPT (IDEMPOTENT VERSION)
-- Generated: 2025-07-04
-- 
-- This migration is fully idempotent - can be run multiple times safely
-- All operations check for existence before creating/altering

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Create triggers if they don't exist
DO $$
BEGIN
    -- Create trigger for agencies table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_agencies_updated_at'
    ) THEN
        CREATE TRIGGER update_agencies_updated_at
        BEFORE UPDATE ON agencies
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for trades table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_trades_updated_at'
    ) THEN
        CREATE TRIGGER update_trades_updated_at
        BEFORE UPDATE ON trades
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Create trigger for regions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_regions_updated_at'
    ) THEN
        CREATE TRIGGER update_regions_updated_at
        BEFORE UPDATE ON regions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

-- Create indexes if they don't exist
DO $$
BEGIN
    -- Junction table indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_trades_agency_id') THEN
        CREATE INDEX idx_agency_trades_agency_id ON agency_trades(agency_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_trades_trade_id') THEN
        CREATE INDEX idx_agency_trades_trade_id ON agency_trades(trade_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_regions_agency_id') THEN
        CREATE INDEX idx_agency_regions_agency_id ON agency_regions(agency_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_regions_region_id') THEN
        CREATE INDEX idx_agency_regions_region_id ON agency_regions(region_id);
    END IF;

    -- Performance indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_name_lower') THEN
        CREATE INDEX idx_agencies_name_lower ON agencies(LOWER(name));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_active_featured') THEN
        CREATE INDEX idx_agencies_active_featured ON agencies(is_active, featured) WHERE is_active = true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_claimed') THEN
        CREATE INDEX idx_agencies_claimed ON agencies(is_claimed) WHERE is_claimed = true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_rating') THEN
        CREATE INDEX idx_agencies_rating ON agencies(rating DESC NULLS LAST) WHERE is_active = true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trades_slug') THEN
        CREATE INDEX idx_trades_slug ON trades(slug);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_slug') THEN
        CREATE INDEX idx_regions_slug ON regions(slug);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_regions_state_name') THEN
        CREATE INDEX idx_regions_state_name ON regions(state_code, name);
    END IF;
END $$;

-- Enable Row Level Security (RLS) on all tables if not already enabled
DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY['agencies', 'trades', 'regions', 'agency_trades', 'agency_regions'];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Check if RLS is already enabled
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = tbl 
            AND rowsecurity = true
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            RAISE NOTICE 'Enabled RLS on table: %', tbl;
        END IF;
    END LOOP;
END $$;

-- Create policies if they don't exist
DO $$
BEGIN
    -- Policy for agencies table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'agencies' 
        AND policyname = 'Public can view active agencies'
    ) THEN
        CREATE POLICY "Public can view active agencies" ON agencies
            FOR SELECT
            USING (is_active = true);
    END IF;

    -- Policy for trades table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'trades' 
        AND policyname = 'Public can view all trades'
    ) THEN
        CREATE POLICY "Public can view all trades" ON trades
            FOR SELECT
            USING (true);
    END IF;

    -- Policy for regions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'regions' 
        AND policyname = 'Public can view all regions'
    ) THEN
        CREATE POLICY "Public can view all regions" ON regions
            FOR SELECT
            USING (true);
    END IF;

    -- Policy for agency_trades table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'agency_trades' 
        AND policyname = 'Public can view active agency trades'
    ) THEN
        CREATE POLICY "Public can view active agency trades" ON agency_trades
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM agencies 
                    WHERE agencies.id = agency_trades.agency_id 
                    AND agencies.is_active = true
                )
            );
    END IF;

    -- Policy for agency_regions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'agency_regions' 
        AND policyname = 'Public can view active agency regions'
    ) THEN
        CREATE POLICY "Public can view active agency regions" ON agency_regions
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM agencies 
                    WHERE agencies.id = agency_regions.agency_id 
                    AND agencies.is_active = true
                )
            );
    END IF;
END $$;

-- Add comments for documentation (idempotent - will replace if exists)
COMMENT ON TABLE agencies IS 'Construction staffing agencies directory - RLS ENABLED';
COMMENT ON TABLE trades IS 'Construction trade specialties - RLS ENABLED';
COMMENT ON TABLE regions IS 'Service regions for agencies - RLS ENABLED';
COMMENT ON TABLE agency_trades IS 'Junction table: agencies <-> trades - RLS ENABLED';
COMMENT ON TABLE agency_regions IS 'Junction table: agencies <-> regions - RLS ENABLED';

COMMENT ON COLUMN agencies.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN agencies.is_claimed IS 'Whether agency has claimed their listing';
COMMENT ON COLUMN agencies.is_active IS 'Whether agency is currently active/visible';
COMMENT ON COLUMN agencies.rating IS 'Average rating from 0.00 to 10.00';
COMMENT ON COLUMN regions.state_code IS 'Two-letter US state code';

-- Final verification
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
    RAISE NOTICE '  Tables: % (expected: 5)', table_count;
    RAISE NOTICE '  Indexes: % (expected: 11+)', index_count;
    RAISE NOTICE '  RLS policies: % (expected: 5)', policy_count;
    RAISE NOTICE '  Tables with RLS: % (expected: 5)', rls_count;
END $$;

-- Update statistics for query planner
ANALYZE agencies;
ANALYZE trades;
ANALYZE regions;
ANALYZE agency_trades;
ANALYZE agency_regions;