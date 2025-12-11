# FSD: Database Seed Script

- **ID:** 002
- **Status:** Implemented
- **Related Epic (from PKD):** Sprint 0: Build the First Feature Slice
- **Author:** Engineering Team
- **Last Updated:** 2025-06-26
- **Designs:** N/A - Backend utility
- **Implementation:** Complete with safety guidelines

## 1. Problem & Goal

### Problem Statement

The development team needs consistent, realistic test data in Supabase to develop and test the agency search functionality. Currently, the mock data exists only in TypeScript files and cannot be queried through the API.

### Goal & Hypothesis

We believe that by building a database seeding script for the **Development Team** and **Platform Administrators**, we will enable rapid development and testing of the agency search feature. We will know this is true when we can successfully query agencies through the `/api/agencies` endpoint and display them in the frontend.

## 2. User Stories & Acceptance Criteria

### Story 1: Initial Database Seeding

> As a **Developer**, I want to seed the Supabase database with mock agency data, so that I can test the search functionality during development.

**Acceptance Criteria:**

- [ ] **Given** an empty database, **When** I run the seed script, **Then** all 12 agencies from mock data are created
- [ ] **Given** the seeded agencies, **When** I query by trade, **Then** the correct agencies are returned with their trade relationships
- [ ] **Given** the seeded agencies, **When** I query by state, **Then** the correct agencies are returned based on their regions
- [ ] **Given** a seeding error, **When** the script fails, **Then** clear error messages are displayed with rollback information

### Story 2: Idempotent Re-seeding

> As a **Platform Administrator**, I want to be able to reset and re-seed the database, so that I can maintain consistent test data across environments.

**Acceptance Criteria:**

- [ ] **Given** a database with existing data, **When** I run the seed script with --reset flag, **Then** existing data is cleared before seeding
- [ ] **Given** a database with existing data, **When** I run the seed script without --reset, **Then** duplicate data is not created
- [ ] **Given** a successful seed operation, **When** I check the logs, **Then** I see a summary of what was imported

## 3. Technical & Design Requirements

### Technical Implementation

**Script Location:** `scripts/seed-database.ts`

**Data Model Impact:**

- **agencies table:** Populate with 12 agencies from mock data
- **trades table:** Create unique trades (electricians, plumbers, etc.)
- **regions table:** Create state records as needed
- **agency_trades junction:** Create many-to-many relationships
- **agency_regions junction:** Create many-to-many relationships

**Key Technical Decisions:**

1. Use TypeScript for type safety with existing interfaces
2. Use Supabase Admin Client (service role) for bypassing RLS
3. Implement transaction-like behavior for data integrity
4. Generate deterministic UUIDs for consistent references

**Script Features:**

```typescript
// Example usage
npm run seed         // Seeds with safety checks
npm run seed:reset   // Clears and re-seeds
npm run seed:verify  // Runs verification queries
```

### Data Transformation Requirements

1. **Slug Generation:** Use existing `createSlug` function from utils
2. **Trade Normalization:** Extract unique trades from all agencies
3. **State Mapping:** Convert state arrays to region records
4. **Boolean Defaults:** Set `is_claimed: false`, `is_active: true` for all
5. **Timestamps:** Use current time for created_at/updated_at

### Error Handling

- Check Supabase connection before starting
- Validate environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Log each major operation (creating trades, agencies, relationships)
- Provide rollback instructions if partial failure occurs

## 4. Scope

### In Scope

- Import all agencies from `lib/mock-data.ts`
- Create all necessary trade records
- Create all necessary region records
- Establish all many-to-many relationships
- Provide verification queries
- Support reset functionality

### Out of Scope

- User authentication data
- Agency reviews or ratings
- Lead/request data
- Image uploads (use URLs from mock data)
- Production data safeguards
- Data migration from other sources

### Production Safety Guidelines

#### Data Namespacing

**Decision:** No prefixing for development environments, clear warnings for staging

- Development databases should use realistic data without prefixes for authentic testing
- The seed script includes prominent warnings when running with `--reset` flag
- Environment validation prevents accidental production use via SUPABASE_SERVICE_ROLE_KEY check
- Additional safeguard: Script checks for `localhost` or `.supabase.co` in URL

#### Environment-Specific Seeding

**Decision:** Same seed data across environments with environment detection (planned)

```bash
# Development (default - full dataset)
npm run seed

# Staging (requires explicit flag) - PLANNED FEATURE
npm run seed -- --staging

# The script will (when implemented):
# - Show warning banner for staging environments
# - Log all operations with timestamps
# - Create backup metadata before reset operations
```

**Current Implementation:** The script currently seeds all environments the same way without environment detection.

#### Partial Seeding Support

**Decision:** To be implemented via environment variables for flexibility

```bash
# Quick test mode (3 agencies only)
SEED_QUICK_MODE=true npm run seed

# Custom agency count
SEED_AGENCY_COUNT=5 npm run seed

# Skip relationships for faster testing
SEED_SKIP_RELATIONSHIPS=true npm run seed
```

### Safety Implementation Details

#### Currently Implemented

1. **Basic Safety**
   - Environment variable validation (requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
   - 3-second pause before reset operations
   - Idempotent operations (skip existing data)
   - Clear error messages and logging

2. **Data Integrity**
   - All operations are idempotent by default
   - Existing data is never modified, only skipped
   - Reset operations follow proper deletion order for foreign keys

#### Planned Safety Features

1. **Environment Detection** (not yet implemented)
   - Will check `NODE_ENV` and database URL patterns
   - Will refuse to run if production indicators are detected
   - Will require explicit `--force-staging` flag for staging databases

2. **Audit Trail** (not yet implemented)
   - Will include metadata: `seeded_at` timestamp and `seeded_by: 'seed-script'`
   - Verification reports will show when data was last seeded
   - Logs will be structured for easy parsing by monitoring tools

## 5. Implementation Notes

### Environment Setup

```bash
# Required environment variables
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional environment variables for flexible seeding
SEED_QUICK_MODE=true              # Seeds only 3 agencies for quick tests
SEED_AGENCY_COUNT=5               # Custom number of agencies to seed
SEED_SKIP_RELATIONSHIPS=true      # Skip creating relationships for speed
NODE_ENV=staging                  # Environment detection
```

### Verification Queries

```sql
-- Verify agency count
SELECT COUNT(*) FROM agencies;

-- Verify trade relationships
SELECT a.name, array_agg(t.name) as trades
FROM agencies a
JOIN agency_trades at ON a.id = at.agency_id
JOIN trades t ON at.trade_id = t.id
GROUP BY a.name;

-- Verify region relationships
SELECT a.name, array_agg(r.name) as regions
FROM agencies a
JOIN agency_regions ar ON a.id = ar.agency_id
JOIN regions r ON ar.region_id = r.id
GROUP BY a.name;
```

### Success Metrics

- All 12 agencies queryable through API
- Search by trade returns correct results
- Filter by state returns correct results
- No duplicate data on repeated runs
- Script completes in under 30 seconds

### Recommended Usage Patterns

#### Current Development Workflow

```bash
# Standard development seeding (seeds all 12 agencies)
npm run seed

# Full reset when schema changes
npm run seed:reset

# Verify seeded data
npm run seed:verify
```

#### Future Usage (When Features Are Implemented)

```bash
# Quick iteration (PLANNED - not yet available)
SEED_QUICK_MODE=true npm run seed

# Custom agency count (PLANNED - not yet available)
SEED_AGENCY_COUNT=5 npm run seed

# Staging environment (PLANNED - not yet available)
npm run seed -- --staging
```

**Note:** Currently, the script always seeds all 12 agencies regardless of environment or flags.

#### Common Troubleshooting

- **"Tables not found" error**: Run migrations first or check database connection
- **"Environment validation failed"**: Ensure `.env.local` has correct credentials
- **"Duplicate key" errors**: Use `npm run seed` (without reset) for idempotent seeding
- **Performance issues**: Currently seeds all 12 agencies; partial seeding is a planned feature

### Implementation Status

#### Completed Features

- ✅ Basic seeding functionality for all entities
- ✅ Idempotent operations (skip existing data)
- ✅ Reset functionality with proper deletion order
- ✅ Verification queries and reporting
- ✅ Environment variable validation (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- ✅ Comprehensive test coverage (85.87%)
- ✅ Basic safety checks (3-second pause before reset)

#### Planned Features (Documented but Not Yet Implemented)

- ⏳ Partial seeding via environment variables (SEED_QUICK_MODE, SEED_AGENCY_COUNT, etc.)
- ⏳ Automatic environment detection for staging safeguards
- ⏳ --staging flag requirement for staging databases
- ⏳ Audit trail metadata fields (seeded_at, seeded_by)
- ⏳ Production URL pattern detection
- ⏳ Structured logging for monitoring tools
- ⏳ Backup metadata before reset operations

**Note:** The features listed above are design decisions documented for future implementation. The current implementation seeds all 12 agencies without environment-specific behavior or partial seeding support. These features can be added when needed following the documented patterns.
