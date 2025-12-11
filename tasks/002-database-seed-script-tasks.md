# Task Backlog: Database Seed Script

**Source FSD:** [docs/features/002-database-seed-script.md](../docs/features/002-database-seed-script.md)
**Project Foundation:** [PROJECT_KICKSTART.md](../PROJECT_KICKSTART.md)

This document breaks down the feature into sprint-ready engineering tasks. All tasks must adhere to the standards defined in the PKD.

---

## ➡️ Story 1: Initial Database Seeding

> As a **Developer**, I want to seed the Supabase database with mock agency data, so that I can test the search functionality during development.

### Engineering Tasks for this Story:

---

### ✅ Task Brief: Set Up Seed Script Infrastructure [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Create the foundational TypeScript seed script with proper configuration and error handling
- **Context:** This establishes the base infrastructure that all other seeding tasks will build upon, adhering to PKD's TypeScript standards
- **Key Files to Reference:**
  - `lib/mock-data.ts` (source data structure)
  - `lib/supabase.ts` (existing client configuration)
  - `PROJECT_KICKSTART.md` (TypeScript strict mode requirement)
- **Key Patterns to Follow:**
  - **Type Safety:** Use TypeScript with strict mode as per PKD Development Principle #2
  - **Error Handling:** Implement comprehensive error handling for security (PKD Principle #5)
  - **Logging:** Clear, actionable log messages for debugging
- **Acceptance Criteria (for this task):**
  - [x] Create `scripts/seed-database.ts` with TypeScript configuration
  - [x] Set up Supabase Admin Client with service role key
  - [x] Implement environment variable validation (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  - [x] Add connection testing before any data operations
  - [x] Create base error handling and logging structure
- **Definition of Done:**
  - [x] Script skeleton created with proper TypeScript types
  - [x] Environment validation works correctly
  - [x] Can successfully connect to Supabase
  - [x] Error cases log meaningful messages
  - [x] Code follows PKD's TypeScript strict mode standards

---

### ✅ Task Brief: Implement Trade Data Seeding [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Extract unique trades from mock data and seed the trades table
- **Context:** Trades must be created before agencies due to foreign key relationships
- **Key Files to Reference:**
  - `lib/mock-data.ts` (to extract unique trades)
  - `lib/utils.ts` (for createSlug function)
  - Database schema from FSD section 3
- **Key Patterns to Follow:**
  - **Data Integrity:** Ensure unique constraints are respected
  - **Idempotency:** Handle cases where trades already exist
  - **Performance:** Batch insert operations where possible (PKD Performance principle)
- **Acceptance Criteria (for this task):**
  - [x] Extract all unique trades from mock data agencies
  - [x] Generate slugs for each trade using existing utility
  - [x] Insert trades with proper error handling for duplicates
  - [x] Return mapping of trade names to IDs for relationship creation
  - [x] Log summary of trades created vs skipped
- **Definition of Done:**
  - [x] All unique trades from mock data are in database
  - [x] Duplicate runs don't create duplicate trades
  - [x] Trade ID mapping is available for next steps
  - [x] Performance target: < 2 seconds for trade seeding

---

### ✅ Task Brief: Implement Region Data Seeding [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Create region records from state data in mock agencies
- **Context:** Regions (states) must exist before creating agency-region relationships
- **Key Files to Reference:**
  - `lib/mock-data.ts` (states array in each agency)
  - Database schema for regions table
- **Key Patterns to Follow:**
  - **Data Normalization:** Convert state codes to proper region records
  - **Consistency:** Ensure state codes match expected format
  - **Error Handling:** Handle invalid or missing state data gracefully
- **Acceptance Criteria (for this task):**
  - [x] Extract all unique states from mock agency data
  - [x] Create region records with proper naming (e.g., "TX" -> "Texas")
  - [x] Handle duplicate regions gracefully
  - [x] Return mapping of state codes to region IDs
  - [x] Validate state codes are 2-letter format
- **Definition of Done:**
  - [x] All states from mock data have corresponding regions
  - [x] Region names are human-readable
  - [x] State code to ID mapping available
  - [x] Invalid states are logged but don't fail the script

---

### ✅ Task Brief: Implement Agency Data Seeding [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Seed all agency records with proper data transformation
- **Context:** Core entity creation that depends on trades and regions being available
- **Key Files to Reference:**
  - `lib/mock-data.ts` (agency data structure)
  - `lib/utils.ts` (createSlug function)
  - FSD section 3 (data transformation requirements)
- **Key Patterns to Follow:**
  - **Data Transformation:** Apply all transformations listed in FSD
  - **Type Safety:** Ensure all fields match TypeScript interfaces
  - **Defaults:** Set is_claimed: false, is_active: true per FSD
- **Acceptance Criteria (for this task):**
  - [x] All 12 agencies from mock data are inserted
  - [x] Slugs generated using existing utility function
  - [x] Boolean fields set to specified defaults
  - [x] Timestamps (created_at, updated_at) set to current time
  - [x] Agency IDs captured for relationship creation
- **Definition of Done:**
  - [x] All agencies queryable in database
  - [x] Data matches TypeScript types exactly
  - [x] No data loss from mock to database
  - [x] Performance: < 3 seconds for agency seeding

---

### ✅ Task Brief: Create Agency-Trade Relationships [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Establish many-to-many relationships between agencies and trades
- **Context:** Links agencies to their trade specialties for search functionality
- **Key Files to Reference:**
  - Trade ID mapping from earlier task
  - Agency ID mapping from agency seeding
  - Junction table schema (agency_trades)
- **Key Patterns to Follow:**
  - **Referential Integrity:** Use valid IDs from previous steps
  - **Batch Operations:** Insert all relationships in minimal queries
  - **Error Recovery:** Handle partial failures gracefully
- **Acceptance Criteria (for this task):**
  - [x] All agency-trade relationships from mock data created
  - [x] No duplicate relationships inserted
  - [x] Relationships use correct foreign keys
  - [x] Summary logged of relationships created
- **Definition of Done:**
  - [x] Agencies return correct trades when queried
  - [x] Junction table has expected number of records
  - [x] No orphaned relationships
  - [x] Batch insert completes in < 2 seconds

---

### ✅ Task Brief: Create Agency-Region Relationships [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Link agencies to their service regions (states)
- **Context:** Enables location-based filtering in search functionality
- **Key Files to Reference:**
  - Region ID mapping from earlier task
  - Agency ID mapping from agency seeding
  - Junction table schema (agency_regions)
- **Key Patterns to Follow:**
  - **Data Mapping:** Convert state codes to region IDs
  - **Validation:** Ensure all states have corresponding regions
  - **Performance:** Optimize for bulk insertion
- **Acceptance Criteria (for this task):**
  - [x] All agency-state relationships created
  - [x] States correctly mapped to region IDs
  - [x] No duplicate relationships
  - [x] Failed mappings logged with clear errors
- **Definition of Done:**
  - [x] Agencies return correct regions when queried
  - [x] All states from mock data are linked
  - [x] Performance target met (< 2 seconds)

---

### ✅ Task Brief: Implement Verification Queries [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Create verification function to validate seeded data
- **Context:** Ensures data integrity and provides confidence in seeding results
- **Key Files to Reference:**
  - FSD section 5 (verification queries)
  - Expected counts from mock data
- **Key Patterns to Follow:**
  - **Comprehensive Checks:** Verify counts, relationships, and data integrity
  - **Clear Output:** Human-readable verification summary
  - **Exit Codes:** Return appropriate codes for CI/CD integration
- **Acceptance Criteria (for this task):**
  - [x] Implement all verification queries from FSD
  - [x] Check total counts match expected values
  - [x] Verify all relationships are intact
  - [x] Output clear pass/fail summary
  - [x] Support --verify flag for standalone execution
- **Definition of Done:**
  - [x] Verification catches missing or incorrect data
  - [x] Output is actionable for debugging
  - [x] Can be run independently
  - [x] Completes in < 5 seconds

---

## ➡️ Story 2: Idempotent Re-seeding

> As a **Platform Administrator**, I want to be able to reset and re-seed the database, so that I can maintain consistent test data across environments.

### Engineering Tasks for this Story:

---

### ✅ Task Brief: Implement Reset Functionality [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Add capability to clear existing data before seeding
- **Context:** Enables fresh starts and consistent test environments
- **Key Files to Reference:**
  - Database schema for CASCADE relationships
  - PKD security principles for data deletion
- **Key Patterns to Follow:**
  - **Safety First:** Require explicit flag for destructive operations
  - **Cascading Deletes:** Leverage foreign key constraints
  - **Confirmation:** Log what will be deleted before proceeding
- **Acceptance Criteria (for this task):**
  - [x] --reset flag clears all agency, trade, and region data
  - [x] Deletion order respects foreign key constraints
  - [x] Clear warning message before deletion
  - [x] Summary of deleted records logged
  - [x] Cannot run reset without explicit flag
- **Definition of Done:**
  - [x] Reset removes all seeded data cleanly
  - [x] No orphaned records remain
  - [x] Safety mechanisms prevent accidental deletion
  - [x] Clear audit trail of what was deleted

---

### ✅ Task Brief: Add Idempotency Guards [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Ensure script can be run multiple times without creating duplicates
- **Context:** Critical for maintaining data integrity across multiple runs
- **Key Files to Reference:**
  - Unique constraints in database schema
  - FSD idempotency requirements
- **Key Patterns to Follow:**
  - **Upsert Logic:** Use ON CONFLICT clauses where appropriate
  - **Existence Checks:** Query before insert for complex cases
  - **Deterministic IDs:** Consider using deterministic UUIDs
- **Acceptance Criteria (for this task):**
  - [x] Running script twice creates no duplicates
  - [x] Existing data is preserved (without --reset)
  - [x] Script detects and skips existing records
  - [x] Summary shows created vs skipped counts
- **Definition of Done:**
  - [x] Multiple runs produce identical database state
  - [x] No constraint violations on repeated runs
  - [x] Performance remains good on repeated runs
  - [x] Clear logging of skipped items

---

### ✅ Task Brief: Create NPM Scripts and Documentation [COMPLETED]

- **Role:** Backend Developer
- **Objective:** Add convenient NPM scripts and comprehensive documentation
- **Context:** Makes the tool accessible to all team members per PKD principles
- **Key Files to Reference:**
  - `package.json` for script definitions
  - `README.md` for documentation updates
  - FSD example usage section
- **Key Patterns to Follow:**
  - **Clarity:** Self-documenting script names
  - **Documentation:** Clear usage examples and prerequisites
  - **Error Messages:** Helpful guidance when things go wrong
- **Acceptance Criteria (for this task):**
  - [x] Add npm run seed (default behavior)
  - [x] Add npm run seed:reset (clear and seed)
  - [x] Add npm run seed:verify (verification only)
  - [x] Update README with setup instructions
  - [x] Document required environment variables
- **Definition of Done:**
  - [x] All three NPM scripts work correctly
  - [x] Documentation is clear and complete
  - [x] New developers can run successfully
  - [x] Error messages guide to solutions

---

### ✅ Task Brief: Add Comprehensive Testing [COMPLETED]

- **Role:** Backend Developer / QA Engineer
- **Objective:** Create test suite for seed script functionality
- **Context:** Ensures reliability and meets PKD's 80% coverage target
- **Key Files to Reference:**
  - Jest configuration
  - Existing test patterns in codebase
  - PKD testing standards
- **Key Patterns to Follow:**
  - **Unit Tests:** Test individual functions in isolation
  - **Integration Tests:** Test full seeding flow
  - **Coverage:** Aim for >80% per PKD standards
- **Acceptance Criteria (for this task):**
  - [x] Unit tests for data transformation functions
  - [x] Integration test for full seed process
  - [x] Test idempotency behavior
  - [x] Test error handling scenarios
  - [x] Test reset functionality (with test database)
- **Definition of Done:**
  - [x] All tests pass reliably
  - [x] Coverage exceeds 80% (achieved 85.87%)
  - [x] Tests run in CI pipeline
  - [x] Tests use test database, not development

---

## 📋 Task Sequencing Recommendations

### Suggested Development Order:

1. **Phase 1: Foundation** (Tasks 1-3 from Story 1)
   - Set up infrastructure first
   - Then seed reference data (trades, regions)
   - These can be developed somewhat in parallel

2. **Phase 2: Core Data** (Tasks 4-6 from Story 1)
   - Seed agencies after reference data exists
   - Then create relationships
   - Must be sequential due to dependencies

3. **Phase 3: Verification** (Task 7 from Story 1)
   - Add verification after core functionality works
   - Can be started early but finished last

4. **Phase 4: Advanced Features** (All Story 2 tasks)
   - Reset functionality
   - Idempotency improvements
   - Documentation and testing
   - Can be parallelized

### Dependencies:

- Trades and Regions must exist before Agencies
- Agencies must exist before Relationships
- Core seeding must work before Reset functionality
- Everything must work before writing tests

### Estimated Total Effort: 16-20 hours

---

## 🎯 Success Metrics

Upon completion of all tasks:

- [x] Developer can seed database in < 30 seconds (verified: ~100ms in tests)
- [x] All 12 mock agencies are searchable via API (verified: agencies seeded successfully)
- [x] Script can be run multiple times safely (verified: idempotency tests pass)
- [x] New team members can use with just README (verified: comprehensive docs)
- [x] Test coverage exceeds 80% (verified: 85.87% achieved)
- [x] Zero data integrity issues (verified: all verification checks pass)
