# Sprint 0 Task List: FindConstructionStaffing

## 🎯 Sprint Goal
**Build the First Feature Slice:** As a construction company, I want to search for staffing agencies by trade specialty and see their basic information.

**Success Criteria:**
- Users can search for agencies by trade specialty
- Search results display real data from Supabase
- Page loads in under 3 seconds
- All tests pass in CI/CD pipeline
- Deployment to staging environment works

---

## 📋 Sprint 0 Tasks (Priority Order)

### 1. [Infrastructure] Set up Supabase project and configure database schema
**Acceptance Criteria:**
- [ ] Supabase project created with proper naming
- [ ] Environment variables configured in `.env.local`
- [ ] Database tables created for agencies, trades, and regions
- [ ] RLS policies configured for public read access
- [ ] Connection tested from local environment

**Technical Notes:**
- Use the existing TypeScript types in `lib/supabase.ts` as schema reference
- Enable RLS but allow public read for agencies table
- Create indexes on searchable fields (name, trades, regions)

---

### 2. [Backend] Create the Agency and Trade data models and migrations
**Acceptance Criteria:**
- [ ] Agency table matches the TypeScript interface
- [ ] Trade table with many-to-many relationship to agencies
- [ ] Region table with many-to-many relationship to agencies
- [ ] All foreign keys and constraints properly set
- [ ] Migration scripts documented

**Technical Notes:**
```sql
-- Example schema structure
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE agency_trades (
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  PRIMARY KEY (agency_id, trade_id)
);
```

---

### 3. [Backend] Create a single GET /api/agencies endpoint with basic filtering
**Acceptance Criteria:**
- [ ] API route created at `app/api/agencies/route.ts`
- [ ] Supports query parameters: search, trades[], states[]
- [ ] Returns paginated results (limit 20)
- [ ] Includes related trades and regions in response
- [ ] Proper error handling and status codes

**Technical Notes:**
- Use Supabase client from `lib/supabase.ts`
- Implement search across name and description fields
- Use Supabase's `.textSearch()` for full-text search
- Return data matching the existing frontend expectations

---

### 4. [Backend] Migrate mock data to Supabase for initial testing
**Acceptance Criteria:**
- [ ] Script created to import data from `lib/mock-data.ts`
- [ ] All 12 agencies imported with proper relationships
- [ ] All trades from mock data created and linked
- [ ] All regions properly mapped to agencies
- [ ] Verification query shows correct data

**Technical Notes:**
- Create a migration script at `scripts/seed-database.ts`
- Handle duplicate prevention for re-runs
- Map state names to proper region records
- Generate slugs using the existing `createSlug` function

---

### 5. [Frontend] Connect the existing agency directory to real database
**Acceptance Criteria:**
- [ ] Replace mock data import with API call
- [ ] Loading state while fetching data
- [ ] Error handling for failed API calls
- [ ] Maintain existing UI functionality
- [ ] No visual regression from current design

**Technical Notes:**
- Update `app/page.tsx` to use fetch or SWR
- Create a custom hook `useAgencies` for data fetching
- Implement proper TypeScript types for API responses
- Consider using React Query/SWR for caching

---

### 6. [Frontend] Implement real-time search using Supabase queries
**Acceptance Criteria:**
- [ ] Search updates results as user types (debounced)
- [ ] Filters work with real database queries
- [ ] URL parameters sync with search state
- [ ] Results show loading state during search
- [ ] "No results" state properly displayed

**Technical Notes:**
- Implement 300ms debounce on search input
- Use URL search params for shareable searches
- Update the `FilterState` to work with API
- Optimize queries to stay under 100ms

---

### 7. [CI/CD] Set up GitHub Actions for automated testing and deployment
**Acceptance Criteria:**
- [ ] GitHub Action runs on every PR
- [ ] TypeScript compilation check
- [ ] ESLint and formatting checks
- [ ] Unit tests run and pass
- [ ] Build process completes successfully
- [ ] Deployment to Vercel on merge to main

**Technical Notes:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

### 8. [Testing] Create integration tests for agency search functionality
**Acceptance Criteria:**
- [ ] Test searching by agency name
- [ ] Test filtering by trade specialty
- [ ] Test filtering by location/state
- [ ] Test pagination functionality
- [ ] Test error scenarios (API down, no results)
- [ ] All tests pass in CI pipeline

**Technical Notes:**
- Use Jest and React Testing Library
- Mock Supabase calls for unit tests
- Create E2E tests with Playwright for critical paths
- Test data should use a subset of mock agencies

---

## 🔄 Daily Standup Questions
1. What did you complete yesterday?
2. What are you working on today?
3. Are there any blockers?
4. Do we need to adjust the sprint scope?

---

## 📊 Sprint Tracking

### Velocity Tracking
| Task | Estimated Hours | Actual Hours | Status |
|------|----------------|--------------|---------|
| Supabase Setup | 4 | - | Pending |
| Data Models | 3 | - | Pending |
| API Endpoint | 4 | - | Pending |
| Data Migration | 2 | - | Pending |
| Frontend Connection | 4 | - | Pending |
| Real-time Search | 6 | - | Pending |
| CI/CD Setup | 3 | - | Pending |
| Integration Tests | 4 | - | Pending |
| **Total** | **30** | **-** | **-** |

---

## 🚧 Known Risks & Mitigations

1. **Risk:** Supabase query performance with complex filters
   - **Mitigation:** Create proper indexes, monitor query performance

2. **Risk:** Search functionality doesn't scale
   - **Mitigation:** Prepare to implement Algolia if needed

3. **Risk:** Mock data doesn't represent real-world complexity
   - **Mitigation:** Plan for data model adjustments in Sprint 1

---

## 📝 Definition of Done

A task is considered DONE when:
- [ ] Code is written and committed
- [ ] Unit tests are written and passing
- [ ] Code passes linting and type checking
- [ ] Feature works in local development
- [ ] PR is reviewed and approved
- [ ] Feature is deployed to staging
- [ ] Acceptance criteria are verified

---

## 🎉 Sprint Retrospective Topics
- What went well?
- What could be improved?
- What did we learn about our tech stack?
- Are our estimates accurate?
- Should we adjust our approach for Sprint 1?