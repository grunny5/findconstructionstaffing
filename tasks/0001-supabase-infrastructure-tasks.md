# Task Backlog: Supabase Infrastructure Setup

**Source FSD:** [0001-supabase-infrastructure-setup.md](/docs/features/0001-supabase-infrastructure-setup.md)

This document translates the FSD into actionable engineering tasks. Our primary goal is to establish a working Supabase database infrastructure that enables the transition from mock data to a real, scalable backend.

---

## 🚀 Feature Implementation Tasks

### Story 1: Database Infrastructure Setup

**Goal:** Establish secure Supabase project with proper configuration

#### Task 1.1: Create Supabase Project

- **Role:** Backend Developer / DevOps
- **Objective:** Set up new Supabase project with proper naming and configuration
- **Context:** This is the foundation for all database operations
- **Key Patterns to Follow:**
  - Use consistent naming: "findconstructionstaffing"
  - Select appropriate region for lowest latency
  - Enable email confirmations for security
- **Acceptance Criteria:**
  - [x] Supabase account created/accessed
  - [x] Project named "findconstructionstaffing" created
  - [x] Project URL and anon key obtained
  - [x] Project settings reviewed and optimized
- **Definition of Done:**
  - [x] Project accessible via Supabase dashboard
  - [x] Credentials documented securely
  - [x] Team members granted appropriate access

#### Task 1.2: Configure Environment Variables

- **Role:** Backend Developer
- **Objective:** Set up secure environment configuration for database connection
- **Context:** Ensures secure credential management and easy local setup
- **Key Files to Reference:**
  - `lib/supabase.ts` - Existing client configuration
  - `.gitignore` - Ensure .env.local is excluded
- **Key Patterns to Follow:**
  - Never commit actual credentials
  - Use descriptive variable names
  - Include all necessary configuration
- **Acceptance Criteria:**
  - [x] `.env.local` created with Supabase credentials
  - [x] `.env.example` created with placeholder values
  - [x] Environment variables match expected names in code
  - [x] Connection test script created
- **Definition of Done:**
  - [x] Local environment connects successfully
  - [x] Example file documents all required variables
  - [x] No secrets exposed in version control

---

### Story 2: Database Schema Implementation

**Goal:** Create type-safe database schema matching application needs

#### Task 2.1: Create Core Tables

- **Role:** Backend Developer / Database Engineer
- **Objective:** Implement agencies, trades, and regions tables with proper structure
- **Context:** Schema must match TypeScript interfaces for type safety
- **Key Files to Reference:**
  - `lib/supabase.ts` - TypeScript type definitions
  - FSD Technical Requirements - SQL schema
- **Key Patterns to Follow:**
  - Use UUID for all primary keys
  - Include created_at/updated_at timestamps with automatic update trigger
  - Follow PostgreSQL naming conventions
  - Use NUMERIC(3,2) for rating to support values up to 10.00
- **Acceptance Criteria:**
  - [x] Agencies table created with all fields
  - [x] Trades table created with unique constraints
  - [x] Regions table created with state codes
  - [x] All data types match TypeScript interfaces
  - [x] Updated_at trigger function created and applied
- **Definition of Done:**
  - [x] Tables visible in Supabase dashboard
  - [x] Schema matches FSD specifications exactly
  - [x] No errors when inserting test data

#### Task 2.2: Implement Relationships

- **Role:** Backend Developer / Database Engineer
- **Objective:** Create junction tables for many-to-many relationships
- **Context:** Enables agencies to have multiple trades and service regions
- **Key Patterns to Follow:**
  - Use composite primary keys for junction tables
  - Implement CASCADE deletes for referential integrity
  - No additional fields in junction tables (pure relationships)
- **Acceptance Criteria:**
  - [x] agency_trades junction table created
  - [x] agency_regions junction table created
  - [x] Foreign key constraints properly set
  - [x] Cascade deletes tested and working
- **Definition of Done:**
  - [x] Relationships can be created via Supabase dashboard
  - [x] Deleting an agency removes related records
  - [x] No orphaned records possible

#### Task 2.3: Add Performance Indexes

- **Role:** Backend Developer / Database Engineer
- **Objective:** Optimize query performance with strategic indexes
- **Context:** Critical for maintaining <100ms query times at scale
- **Key Patterns to Follow:**
  - Index frequently searched columns
  - Consider composite indexes for common query patterns
  - Monitor index usage and effectiveness
- **Acceptance Criteria:**
  - [x] Index on agencies.name for text search
  - [x] Index on agencies.slug for URL lookups
  - [x] Index on agencies.is_active for filtering
  - [x] Indexes on trade and region lookup fields
- **Definition of Done:**
  - [x] All indexes created as specified
  - [x] Query plans show index usage
  - [x] No negative impact on write performance

---

### Story 3: Security Configuration

**Goal:** Implement Row Level Security for data protection

#### Task 3.1: Enable RLS on All Tables

- **Role:** Security Engineer / Backend Developer
- **Objective:** Activate Row Level Security to control data access
- **Context:** Foundation for future authentication and authorization
- **Key Patterns to Follow:**
  - Enable RLS before creating any policies (secure by default)
  - Document the security model clearly
  - Test both positive and negative cases
- **Acceptance Criteria:**
  - [x] RLS enabled on agencies table
  - [x] RLS enabled on trades table
  - [x] RLS enabled on regions table
  - [x] RLS enabled on junction tables
  - [x] Direct table access blocked by default
- **Definition of Done:**
  - [x] Cannot query tables without policies
  - [x] Supabase dashboard shows RLS active
  - [x] Security model documented

#### Task 3.2: Create Public Read Policies

- **Role:** Security Engineer / Backend Developer
- **Objective:** Allow anonymous read access for public directory
- **Context:** Agencies directory must be publicly viewable
- **Key Patterns to Follow:**
  - Use descriptive policy names
  - Keep policies simple and auditable
  - Consider future authenticated access
- **Acceptance Criteria:**
  - [x] Public read policy for agencies (active only)
  - [x] Public read policy for trades
  - [x] Public read policy for regions
  - [x] Public read policy for relationships
  - [x] No write access for anonymous users
- **Definition of Done:**
  - [x] Anonymous users can read active agencies
  - [x] All relationships properly accessible
  - [x] Write operations properly blocked

#### Task 3.3: Create RLS read policies on agency_trades & agency_regions

- **Role:** Security Engineer / Backend Developer
- **Objective:** Implement Row Level Security on junction tables to ensure proper relationship access
- **Context:** Junction tables must only expose relationships for active agencies
- **Key Patterns to Follow:**
  - Junction table policies must check parent agency status
  - Use joins or subqueries to verify agency.is_active
  - Maintain referential integrity in security policies
- **Acceptance Criteria:**
  - [x] RLS policy on agency_trades allows SELECT only when agency.is_active = true
  - [x] RLS policy on agency_regions allows SELECT only when agency.is_active = true
  - [x] No INSERT, UPDATE, or DELETE allowed for anonymous users
  - [x] Inactive agencies' relationships are not exposed
  - [x] Queries joining agencies with trades/regions work correctly
- **Definition of Done:**
  - [x] Junction table queries return only active agency relationships
  - [x] Test confirms inactive agency relationships are hidden
  - [x] Directory queries with filters work correctly
  - [x] Performance impact is minimal (<10ms added)

---

### Story 4: Data Migration Readiness

**Goal:** Prepare database for receiving mock data

#### Task 4.1: Validate Schema Compatibility

- **Role:** Backend Developer / QA Engineer
- **Objective:** Ensure database schema accepts all mock data fields
- **Context:** Prevents data loss during migration
- **Key Files to Reference:**
  - `lib/mock-data.ts` - Source data structure
  - Migration script requirements from FSD
- **Key Patterns to Follow:**
  - Map every mock field to database column
  - Handle data type conversions
  - Document any transformations needed
- **Acceptance Criteria:**
  - [x] All mock agency fields map to columns
  - [x] Trade names match expected values
  - [x] State names convert to region records
  - [x] Test insert of one complete agency succeeds
- **Definition of Done:**
  - [x] Compatibility matrix documented
  - [x] Sample data inserts successfully
  - [x] No data truncation or type errors

#### Task 4.2: Create Verification Queries

- **Role:** Backend Developer / QA Engineer
- **Objective:** Build queries to validate migrated data integrity
- **Context:** Ensures migration success can be measured
- **Key Patterns to Follow:**
  - Test all relationships
  - Verify data completeness
  - Check for data corruption
- **Acceptance Criteria:**
  - [x] Query to count agencies and related data
  - [x] Query to verify all trades are linked
  - [x] Query to check region assignments
  - [x] Query to find orphaned records
- **Definition of Done:**
  - [x] All queries documented
  - [x] Expected results defined
  - [x] Queries saved for migration validation

---

## 🧪 Testing Tasks

### Task 5.1: Connection Testing

- **Role:** QA Engineer / Backend Developer
- **Objective:** Verify reliable database connectivity
- **Context:** Foundation for all database operations
- **Acceptance Criteria:**
  - [x] Connection test script created
  - [x] Success/failure cases handled
  - [x] Connection pooling verified
  - [x] Timeout scenarios tested
- **Definition of Done:**
  - [x] 100% connection success rate
  - [x] Proper error messages for failures
  - [x] Performance within requirements

### Task 5.2: Security Testing

- **Role:** Security Engineer / QA Engineer
- **Objective:** Validate RLS policies work as intended
- **Context:** Critical for data protection
- **Acceptance Criteria:**
  - [x] Anonymous read access verified
  - [x] Write operations blocked confirmed
  - [x] SQL injection attempts prevented
  - [x] Policy bypass attempts failed
- **Definition of Done:**
  - [x] Security test suite complete
  - [x] All tests passing
  - [x] No vulnerabilities found

---

## 📚 Documentation Tasks

### Task 6.1: Setup Documentation

- **Role:** Technical Writer / Backend Developer
- **Objective:** Document complete setup process
- **Context:** Enables team self-service and onboarding
- **Key Deliverables:**
  - Database setup guide
  - Environment configuration steps
  - Troubleshooting guide
  - Architecture decisions record
- **Definition of Done:**
  - [x] New developer can set up in <30 minutes
  - [x] All steps clearly documented
  - [x] Common issues addressed

---

## 📊 Task Tracking

| Task ID   | Description                             | Assignee | Estimated Hours | Status       |
| --------- | --------------------------------------- | -------- | --------------- | ------------ |
| 1.1       | Create Supabase Project                 | -        | 0.5             | ✅ Completed |
| 1.2       | Configure Environment Variables         | -        | 0.5             | ✅ Completed |
| 2.1       | Create Core Tables                      | -        | 1.5             | ✅ Completed |
| 2.2       | Implement Relationships                 | -        | 1.0             | ✅ Completed |
| 2.3       | Add Performance Indexes                 | -        | 0.5             | ✅ Completed |
| 3.1       | Enable RLS on All Tables                | -        | 0.5             | ✅ Completed |
| 3.2       | Create Public Read Policies             | -        | 1.0             | ✅ Completed |
| 3.3       | Create RLS Policies for Junction Tables | -        | 1.0             | ✅ Completed |
| 4.1       | Validate Schema Compatibility           | -        | 0.5             | ✅ Completed |
| 4.2       | Create Verification Queries             | -        | 0.5             | ✅ Completed |
| 5.1       | Connection Testing                      | -        | 1.0             | ✅ Completed |
| 5.2       | Security Testing                        | -        | 1.0             | ✅ Completed |
| 6.1       | Setup Documentation                     | -        | 1.0             | ✅ Completed |
| **Total** |                                         |          | **10.5**        |              |

---

## ✅ Feature Definition of Done

The Supabase Infrastructure Setup feature is complete when:

- [x] All tasks marked as complete
- [x] Database accessible from application
- [ ] All tests passing in CI/CD pipeline _(Note: Tests created and passing locally, CI/CD pipeline integration pending)_
- [x] Performance meets <100ms requirement
- [x] Security audit passed
- [x] Documentation reviewed and approved
- [x] Team successfully connected locally
- [x] Ready for data migration

---

## 🚦 Risk Register

| Risk                      | Impact | Likelihood | Mitigation                               |
| ------------------------- | ------ | ---------- | ---------------------------------------- |
| Supabase rate limits      | High   | Low        | Monitor usage, upgrade plan if needed    |
| Schema changes needed     | Medium | Medium     | Design for extensibility, use migrations |
| Performance degradation   | High   | Low        | Indexes created, monitoring in place     |
| Security misconfiguration | High   | Low        | Multiple reviews, security testing       |

---

**Next Feature:** After this infrastructure is complete, the next feature should be Task 3 from Sprint 0: "Create GET /api/agencies endpoint" which will build upon this database foundation.
