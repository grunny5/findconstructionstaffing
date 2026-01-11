-- Performance indexes to optimize API query performance
-- Addresses slow queries on /api/agencies (490-2022ms) and /api/agencies/[slug] (250-991ms)

DO $$
BEGIN
    -- Critical: Index for is_active filter (used in every agencies query)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_is_active') THEN
        CREATE INDEX idx_agencies_is_active ON agencies(is_active) WHERE is_active = true;
        RAISE NOTICE 'Created index: idx_agencies_is_active';
    END IF;

    -- Index for single-agency lookup by slug (used by /api/agencies/[slug])
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_slug') THEN
        CREATE INDEX idx_agencies_slug ON agencies(slug);
        RAISE NOTICE 'Created index: idx_agencies_slug';
    END IF;

    -- Composite index for compliance filtering (is_active + agency_id)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agency_compliance_active_agency') THEN
        CREATE INDEX idx_agency_compliance_active_agency
        ON agency_compliance(agency_id)
        WHERE is_active = true;
        RAISE NOTICE 'Created index: idx_agency_compliance_active_agency';
    END IF;

    -- Composite index for profile completion sorting with is_active filter
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agencies_completion_sort') THEN
        CREATE INDEX idx_agencies_completion_sort
        ON agencies(profile_completion_percentage DESC, name ASC)
        WHERE is_active = true;
        RAISE NOTICE 'Created index: idx_agencies_completion_sort';
    END IF;

END $$;

-- Update table statistics for query planner
ANALYZE agencies;
ANALYZE agency_compliance;

-- Add comments for documentation
COMMENT ON INDEX idx_agencies_is_active IS 'Optimizes filtering by is_active (used in every query)';
COMMENT ON INDEX idx_agencies_slug IS 'Optimizes single-agency lookup by slug';
COMMENT ON INDEX idx_agency_compliance_active_agency IS 'Optimizes compliance data joins for active compliance items';
COMMENT ON INDEX idx_agencies_completion_sort IS 'Optimizes default sorting by profile completion percentage';
