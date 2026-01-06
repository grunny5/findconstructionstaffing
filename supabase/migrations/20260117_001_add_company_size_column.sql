-- Migration: Add company_size column to agencies table
--
-- Description: Adds the company_size column that is referenced by the
-- profile_completion_percentage calculation but was never added to the schema.
-- Valid values: Small, Medium, Large, Enterprise
--
-- Related migrations:
-- - 20251225_001_create_profile_completion_trigger.sql (references company_size)
-- - 20260113_001_fix_function_search_path.sql (references company_size)

-- Add company_size column to agencies table
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Add comment documenting the column
COMMENT ON COLUMN public.agencies.company_size IS 'Company size category: Small, Medium, Large, or Enterprise';

-- Optional: Add check constraint for valid values
-- Uncomment if you want to enforce specific values at the database level
-- ALTER TABLE public.agencies
--   ADD CONSTRAINT agencies_company_size_check
--   CHECK (company_size IS NULL OR company_size IN ('Small', 'Medium', 'Large', 'Enterprise'));
