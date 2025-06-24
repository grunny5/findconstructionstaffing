# Task Backlog: Supabase Infrastructure Setup

**Source FSD:** [0001-supabase-infrastructure-setup.md](/docs/features/0001-supabase-infrastructure-setup.md)

This document translates the FSD into actionable engineering tasks. Our primary goal is to establish a working Supabase database infrastructure that enables the transition from mock data to a real, scalable backend.

---

## 🚀 Feature Implementation Tasks

### Story 1: Database Infrastructure Setup
**Goal:** Establish secure Supabase project with proper configuration

#### Task 1.1: Create Supabase Project
* **Role:** Backend Developer / DevOps
* **Objective:** Set up new Supabase project with proper naming and configuration
* **Context:** This is the foundation for all database operations
* **Key Patterns to Follow:**
  * Use consistent naming: "findconstructionstaffing"
  * Select appropriate region for lowest latency
  * Enable email confirmations for security
* **Acceptance Criteria:**
  * [ ] Supabase account created/accessed
  * [ ] Project named "findconstructionstaffing" created
  * [ ] Project URL and anon key obtained
  * [ ] Project settings reviewed and optimized
* **Definition of Done:**
  * [ ] Project accessible via Supabase dashboard
  * [ ] Credentials documented securely
  * [ ] Team members granted appropriate access

#### Task 1.2: Configure Environment Variables
* **Role:** Backend Developer
* **Objective:** Set up secure environment configuration for database connection
* **Context:** Ensures secure credential management and easy local setup
* **Key Files to Reference:**
  * `lib/supabase.ts` - Existing client configuration
  * `.gitignore` - Ensure .env.local is excluded
* **Key Patterns to Follow:**
  * Never commit actual credentials
  * Use descriptive variable names
  * Include all necessary configuration
* **Acceptance Criteria:**
  * [ ] `.env.local` created with Supabase credentials
  * [ ] `.env.example` created with placeholder values
  * [ ] Environment variables match expected names in code
  * [ ] Connection test script created
* **Definition of Done:**
  * [ ] Local environment connects successfully
  * [ ] Example file documents all required variables
  * [ ] No secrets exposed in version control

---

### Story 2: Database Schema Implementation
**Goal:** Create type-safe database schema matching application needs

#### Task 2.1: Create Core Tables
* **Role:** Backend Developer / Database Engineer
* **Objective:** Implement agencies, trades, and regions tables with proper structure
* **Context:** Schema must match TypeScript interfaces for type safety
* **Key Files to Reference:**
  * `lib/supabase.ts` - TypeScript type definitions
  * FSD Technical Requirements - SQL schema
* **Key Patterns to Follow:**
  * Use UUID for all primary keys
  * Include created_at/updated_at timestamps with automatic update trigger
  * Follow PostgreSQL naming conventions
  * Use NUMERIC(3,2) for rating to support values up to 10.00
* **Acceptance Criteria:**
  * [ ] Agencies table created with all fields
  * [ ] Trades table created with unique constraints
  * [ ] Regions table created with state codes
  * [ ] All data types match TypeScript interfaces
  * [ ] Updated_at trigger function created and applied
* **Definition of Done:**
  * [ ] Tables visible in Supabase dashboard
  * [ ] Schema matches FSD specifications exactly
  * [ ] No errors when inserting test data

#### Task 2.2: Implement Relationships
* **Role:** Backend Developer / Database Engineer
* **Objective:** Create junction tables for many-to-many relationships
* **Context:** Enables agencies to have multiple trades and service regions
* **Key Patterns to Follow:**
  * Use composite primary keys for junction tables
  * Implement CASCADE deletes for referential integrity
  * No additional fields in junction tables (pure relationships)
* **Acceptance Criteria:**
  * [ ] agency_trades junction table created
  * [ ] agency_regions junction table created
  * [ ] Foreign key constraints properly set
  * [ ] Cascade deletes tested and working
* **Definition of Done:**
  * [ ] Relationships can be created via Supabase dashboard
  * [ ] Deleting an agency removes related records
  * [ ] No orphaned records possible

#### Task 2.3: Add Performance Indexes
* **Role:** Backend Developer / Database Engineer
* **Objective:** Optimize query performance with strategic indexes
* **Context:** Critical for maintaining <100ms query times at scale
* **Key Patterns to Follow:**
  * Index frequently searched columns
  * Consider composite indexes for common query patterns
  * Monitor index usage and effectiveness
* **Acceptance Criteria:**
  * [ ] Index on agencies.name for text search
  * [ ] Index on agencies.slug for URL lookups
  * [ ] Index on agencies.is_active for filtering
  * [ ] Indexes on trade and region lookup fields
* **Definition of Done:**
  * [ ] All indexes created as specified
  * [ ] Query plans show index usage
  * [ ] No negative impact on write performance

---

### Story 3: Security Configuration
**Goal:** Implement Row Level Security for data protection

#### Task 3.1: Enable RLS on All Tables
* **Role:** Security Engineer / Backend Developer
* **Objective:** Activate Row Level Security to control data access
* **Context:** Foundation for future authentication and authorization
* **Key Patterns to Follow:**
  * Enable RLS before creating any policies (secure by default)
  * Document the security model clearly
  * Test both positive and negative cases
* **Acceptance Criteria:**
  * [ ] RLS enabled on agencies table
  * [ ] RLS enabled on trades table
  * [ ] RLS enabled on regions table
  * [ ] RLS enabled on junction tables
  * [ ] Direct table access blocked by default
* **Definition of Done:**
  * [ ] Cannot query tables without policies
  * [ ] Supabase dashboard shows RLS active
  * [ ] Security model documented

#### Task 3.2: Create Public Read Policies
* **Role:** Security Engineer / Backend Developer
* **Objective:** Allow anonymous read access for public directory
* **Context:** Agencies directory must be publicly viewable
* **Key Patterns to Follow:**
  * Use descriptive policy names
  * Keep policies simple and auditable
  * Consider future authenticated access
* **Acceptance Criteria:**
  * [ ] Public read policy for agencies (active only)
  * [ ] Public read policy for trades
  * [ ] Public read policy for regions
  * [ ] Public read policy for relationships
  * [ ] No write access for anonymous users
* **Definition of Done:**
  * [ ] Anonymous users can read active agencies
  * [ ] All relationships properly accessible
  * [ ] Write operations properly blocked

---

### Story 4: Data Migration Readiness
**Goal:** Prepare database for receiving mock data

#### Task 4.1: Validate Schema Compatibility
* **Role:** Backend Developer / QA Engineer
* **Objective:** Ensure database schema accepts all mock data fields
* **Context:** Prevents data loss during migration
* **Key Files to Reference:**
  * `lib/mock-data.ts` - Source data structure
  * Migration script requirements from FSD
* **Key Patterns to Follow:**
  * Map every mock field to database column
  * Handle data type conversions
  * Document any transformations needed
* **Acceptance Criteria:**
  * [ ] All mock agency fields map to columns
  * [ ] Trade names match expected values
  * [ ] State names convert to region records
  * [ ] Test insert of one complete agency succeeds
* **Definition of Done:**
  * [ ] Compatibility matrix documented
  * [ ] Sample data inserts successfully
  * [ ] No data truncation or type errors

#### Task 4.2: Create Verification Queries
* **Role:** Backend Developer / QA Engineer
* **Objective:** Build queries to validate migrated data integrity
* **Context:** Ensures migration success can be measured
* **Key Patterns to Follow:**
  * Test all relationships
  * Verify data completeness
  * Check for data corruption
* **Acceptance Criteria:**
  * [ ] Query to count agencies and related data
  * [ ] Query to verify all trades are linked
  * [ ] Query to check region assignments
  * [ ] Query to find orphaned records
* **Definition of Done:**
  * [ ] All queries documented
  * [ ] Expected results defined
  * [ ] Queries saved for migration validation

---

## 🧪 Testing Tasks

### Task 5.1: Connection Testing
* **Role:** QA Engineer / Backend Developer
* **Objective:** Verify reliable database connectivity
* **Context:** Foundation for all database operations
* **Acceptance Criteria:**
  * [ ] Connection test script created
  * [ ] Success/failure cases handled
  * [ ] Connection pooling verified
  * [ ] Timeout scenarios tested
* **Definition of Done:**
  * [ ] 100% connection success rate
  * [ ] Proper error messages for failures
  * [ ] Performance within requirements

### Task 5.2: Security Testing
* **Role:** Security Engineer / QA Engineer
* **Objective:** Validate RLS policies work as intended
* **Context:** Critical for data protection
* **Acceptance Criteria:**
  * [ ] Anonymous read access verified
  * [ ] Write operations blocked confirmed
  * [ ] SQL injection attempts prevented
  * [ ] Policy bypass attempts failed
* **Definition of Done:**
  * [ ] Security test suite complete
  * [ ] All tests passing
  * [ ] No vulnerabilities found

---

## 📚 Documentation Tasks

### Task 6.1: Setup Documentation
* **Role:** Technical Writer / Backend Developer
* **Objective:** Document complete setup process
* **Context:** Enables team self-service and onboarding
* **Key Deliverables:**
  * Database setup guide
  * Environment configuration steps
  * Troubleshooting guide
  * Architecture decisions record
* **Definition of Done:**
  * [ ] New developer can set up in <30 minutes
  * [ ] All steps clearly documented
  * [ ] Common issues addressed

---

## 📊 Task Tracking

| Task ID | Description | Assignee | Estimated Hours | Status |
|---------|-------------|----------|-----------------|---------|
| 1.1 | Create Supabase Project | - | 0.5 | Not Started |
| 1.2 | Configure Environment Variables | - | 0.5 | Not Started |
| 2.1 | Create Core Tables | - | 1.5 | Not Started |
| 2.2 | Implement Relationships | - | 1.0 | Not Started |
| 2.3 | Add Performance Indexes | - | 0.5 | Not Started |
| 3.1 | Enable RLS on All Tables | - | 0.5 | Not Started |
| 3.2 | Create Public Read Policies | - | 1.0 | Not Started |
| 4.1 | Validate Schema Compatibility | - | 0.5 | Not Started |
| 4.2 | Create Verification Queries | - | 0.5 | Not Started |
| 5.1 | Connection Testing | - | 1.0 | Not Started |
| 5.2 | Security Testing | - | 1.0 | Not Started |
| 6.1 | Setup Documentation | - | 1.0 | Not Started |
| **Total** | | | **9.5** | |

---

## ✅ Feature Definition of Done

The Supabase Infrastructure Setup feature is complete when:

- [ ] All tasks marked as complete
- [ ] Database accessible from application
- [ ] All tests passing in CI/CD pipeline
- [ ] Performance meets <100ms requirement
- [ ] Security audit passed
- [ ] Documentation reviewed and approved
- [ ] Team successfully connected locally
- [ ] Ready for data migration

---

## 🚦 Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase rate limits | High | Low | Monitor usage, upgrade plan if needed |
| Schema changes needed | Medium | Medium | Design for extensibility, use migrations |
| Performance degradation | High | Low | Indexes created, monitoring in place |
| Security misconfiguration | High | Low | Multiple reviews, security testing |

---

**Next Feature:** After this infrastructure is complete, the next feature should be Task 3 from Sprint 0: "Create GET /api/agencies endpoint" which will build upon this database foundation.