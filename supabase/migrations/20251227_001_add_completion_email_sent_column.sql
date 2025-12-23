-- Migration: Add completion_email_sent column to agencies table
-- Purpose: Track whether the profile completion milestone email has been sent
-- Related: Task 5.3.3 - Send Completion Milestone Email

-- Add column to track if completion email has been sent
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS completion_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient querying of agencies needing completion emails
CREATE INDEX IF NOT EXISTS idx_agencies_completion_email
ON agencies(profile_completion_percentage, completion_email_sent)
WHERE profile_completion_percentage = 100 AND completion_email_sent = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN agencies.completion_email_sent IS
'Flag indicating whether the profile completion milestone email has been sent. Set to TRUE after sending the congratulations email when profile reaches 100% completion for the first time.';
