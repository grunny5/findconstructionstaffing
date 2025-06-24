# FSD: Supabase Infrastructure Setup

* **ID:** 0001
* **Status:** Draft
* **Related Epic:** Database & Backend Core
* **Author:** Product Team
* **Last Updated:** 2024-12-24
* **Designs:** N/A - Infrastructure feature

## 1. Problem & Goal

### Problem Statement

Construction companies and staffing agencies currently interact with static mock data that cannot scale, persist changes, or support real-world search patterns. This prevents the platform from delivering its core value proposition: connecting construction companies with qualified staffing partners through dynamic, real-time search and filtering.

### Goal & Hypothesis

We believe that by implementing a Supabase PostgreSQL database with proper schema design and real-time capabilities, we will enable dynamic data management and scalable search functionality. We will know this is true when we see:
- Database queries returning results in under 100ms for 95% of requests
- Successful data migration of all 12 mock agencies with 100% accuracy
- Zero connection failures during standard operation
- Search functionality working across all filter combinations

## 2. User Stories & Acceptance Criteria

### Story 1: Database Infrastructure Setup

> As a **Platform Administrator**, I want **a properly configured Supabase project with secure connections**, so that **the application can store and retrieve data reliably**.

**Acceptance Criteria:**

* [ ] **Given** a new Supabase account, **When** I create a project named "findconstructionstaffing", **Then** I receive a project URL and anon key for configuration
* [ ] **Given** the Supabase credentials, **When** I configure environment variables in `.env.local`, **Then** the application can establish a secure connection
* [ ] **Given** a configured project, **When** I test the connection from the application, **Then** I receive a successful response within 100ms
* [ ] **Given** the need for team collaboration, **When** I create `.env.example`, **Then** other developers can set up their local environment

### Story 2: Database Schema Implementation

> As a **Backend Developer**, I want **a properly structured database schema matching our TypeScript interfaces**, so that **I can implement type-safe database operations**.

**Acceptance Criteria:**

* [ ] **Given** the TypeScript interfaces in `lib/supabase.ts`, **When** I create the agencies table, **Then** all fields match the interface with proper data types
* [ ] **Given** the need for many-to-many relationships, **When** I create trades and regions tables, **Then** junction tables properly link agencies to their specialties and locations
* [ ] **Given** search requirements, **When** I add indexes, **Then** queries on name, trades, and regions fields execute in under 50ms
* [ ] **Given** the need for data integrity, **When** I set up foreign keys, **Then** cascade deletes work properly and orphaned records are prevented

### Story 3: Security Configuration

> As a **Security Engineer**, I want **Row Level Security (RLS) policies configured on all tables**, so that **data access is controlled and future authentication can be implemented seamlessly**.

**Acceptance Criteria:**

* [ ] **Given** all database tables, **When** I enable RLS, **Then** direct table access is blocked by default
* [ ] **Given** the public directory requirement, **When** I create read policies for agencies, trades, and regions, **Then** anonymous users can view but not modify data
* [ ] **Given** future authentication needs, **When** I structure RLS policies, **Then** they can be extended to support user-based permissions
* [ ] **Given** security best practices, **When** I audit the policies, **Then** no data leakage paths exist

### Story 4: Data Migration Readiness

> As a **Data Engineer**, I want **the database ready to receive migrated mock data**, so that **we can transition from static to dynamic data seamlessly**.

**Acceptance Criteria:**

* [ ] **Given** the mock data structure, **When** I verify the schema, **Then** all mock data fields have corresponding database columns
* [ ] **Given** the need for unique identifiers, **When** I configure slug generation, **Then** the `createSlug` function output matches database constraints
* [ ] **Given** data relationships, **When** I test inserting related data, **Then** agencies, trades, and regions link correctly through junction tables
* [ ] **Given** the need for data verification, **When** I create test queries, **Then** I can retrieve agencies with all their associated trades and regions

## 3. Technical & Design Requirements

### UX/UI Requirements

* N/A - This is a backend infrastructure feature

### Technical Impact Analysis

* **Data Model:**
  ```sql
  -- Core tables as defined in TypeScript interfaces
  CREATE TABLE agencies (
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
    rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    project_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state_code CHAR(2) NOT NULL,
    slug TEXT UNIQUE NOT NULL
  );

  -- Junction tables
  CREATE TABLE agency_trades (
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, trade_id)
  );

  CREATE TABLE agency_regions (
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, region_id)
  );

  -- Indexes for performance
  CREATE INDEX idx_agencies_name ON agencies(name);
  CREATE INDEX idx_agencies_slug ON agencies(slug);
  CREATE INDEX idx_agencies_active ON agencies(is_active);
  CREATE INDEX idx_trades_name ON trades(name);
  CREATE INDEX idx_regions_state ON regions(state_code);
  ```

* **API Endpoints:** None in this phase - API implementation is Task 3

* **Non-Functional Requirements:**
  - Database queries must return within 100ms for 95th percentile
  - Connection pool must support at least 20 concurrent connections
  - All sensitive data (keys, URLs) must be stored in environment variables
  - Database must be backed up daily with 7-day retention
  - Schema changes must be versioned and reversible

## 4. Scope

### Out of Scope

* User authentication setup (only RLS structure preparation)
* API endpoint implementation (separate task)
* Data migration execution (separate task)
* Advanced search features (full-text search optimization)
* Database replication or read replicas
* Custom Supabase Edge Functions

### Open Questions

* [ ] **Question:** Should we implement soft deletes (is_deleted flag) or hard deletes for agencies?
  - **Owner:** Tech Lead
  - **Target Date:** Before schema finalization
  
* [ ] **Question:** Do we need audit trails (created_by, updated_by) in this phase?
  - **Owner:** Security Lead
  - **Target Date:** Before RLS implementation

* [ ] **Question:** What is the expected growth rate for data volume planning?
  - **Owner:** Product Manager
  - **Target Date:** Before index optimization

## 5. Success Metrics

### Technical Metrics
- [ ] Connection success rate: 100%
- [ ] Query performance: <100ms for 95% of queries
- [ ] Schema validation: 100% match with TypeScript interfaces
- [ ] RLS coverage: 100% of tables protected

### Development Metrics
- [ ] Setup time for new developers: <30 minutes
- [ ] Zero security vulnerabilities in setup
- [ ] Documentation completeness: All steps documented

## 6. Testing Strategy

### Unit Tests
- Connection establishment and error handling
- Schema validation against TypeScript types
- RLS policy verification

### Integration Tests
- End-to-end connection from Next.js to Supabase
- Query performance under load
- Concurrent connection handling

### Security Tests
- RLS policy penetration testing
- Environment variable exposure checks
- SQL injection prevention verification

## 7. Rollback Plan

If issues arise during implementation:
1. Application continues using mock data (no breaking changes)
2. Supabase project can be deleted and recreated
3. Environment variables can be reverted
4. No data loss risk as mock data remains source of truth

## 8. Dependencies

- Supabase account creation
- Environment variable management system
- TypeScript interfaces in `lib/supabase.ts` (already complete)
- Team agreement on data model structure

## 9. Estimated Timeline

- Supabase project creation: 30 minutes
- Schema implementation: 2 hours
- RLS configuration: 45 minutes
- Testing and verification: 1 hour
- Documentation: 30 minutes
- **Total: ~4.5 hours**

---

**Next Steps:** 
1. This FSD is ready for technical review
2. Upon approval, we can begin implementation following the Sprint 0 task list
3. The next FSD should cover the API endpoint implementation (Task 3)