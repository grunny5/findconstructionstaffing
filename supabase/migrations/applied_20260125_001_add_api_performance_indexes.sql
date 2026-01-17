-- Performance indexes to optimize API query performance
-- Addresses slow queries on /api/agencies (490-2022ms) and /api/agencies/[slug] (250-991ms)
--
-- IMPORTANT: Uses CONCURRENTLY to avoid table locking during production deployment
-- CONCURRENTLY cannot be used inside transaction blocks, so each index is created separately

-- Critical: Index for is_active filter (used in every agencies query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_is_active
ON agencies(is_active)
WHERE is_active = true;

-- Index for single-agency lookup by slug (used by /api/agencies/[slug])
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_slug
ON agencies(slug);

-- Composite index for compliance filtering (is_active + agency_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_compliance_active_agency
ON agency_compliance(agency_id)
WHERE is_active = true;

-- Composite index for profile completion sorting with is_active filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_completion_sort
ON agencies(profile_completion_percentage DESC, name ASC)
WHERE is_active = true;

-- Update table statistics for query planner
ANALYZE agencies;
ANALYZE agency_compliance;

-- Add comments for documentation
COMMENT ON INDEX idx_agencies_is_active IS 'Optimizes filtering by is_active (used in every query)';
COMMENT ON INDEX idx_agencies_slug IS 'Optimizes single-agency lookup by slug';
COMMENT ON INDEX idx_agency_compliance_active_agency IS 'Optimizes compliance data joins for active compliance items';
COMMENT ON INDEX idx_agencies_completion_sort IS 'Optimizes default sorting by profile completion percentage';
