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