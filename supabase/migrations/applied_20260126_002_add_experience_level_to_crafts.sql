-- =============================================================================
-- Add Experience Level Field to Labor Request Crafts
-- Created: 2026-01-15
-- Feature: 062-request-labor
-- Description: Adds experience level field to specify skill level required
--              for each craft (Helper, Apprentice, Journeyman, etc.)
-- =============================================================================

ALTER TABLE labor_request_crafts
ADD COLUMN IF NOT EXISTS experience_level TEXT NOT NULL DEFAULT 'Journeyman'
  CHECK (experience_level IN (
    'Helper',
    'Apprentice',
    'Journeyman',
    'Foreman',
    'General Foreman',
    'Superintendent',
    'Project Manager'
  ));

-- Add comment
COMMENT ON COLUMN labor_request_crafts.experience_level IS
  'Required experience level for the craft position (Helper, Apprentice, Journeyman, Foreman, General Foreman, Superintendent, Project Manager)';
