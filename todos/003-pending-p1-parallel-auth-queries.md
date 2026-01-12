---
status: pending
priority: p1
issue_id: "003"
tags: [performance, database, auth]
dependencies: []
---

# Parallelize auth context database queries

Reduce auth initialization time from worst-case 16s to max 8s by fetching profile and agency slug in parallel.

## Problem Statement

Auth context in `lib/auth/auth-context.tsx` executes two database queries sequentially: first fetching user profile (8s timeout), then agency slug if user is agency_owner (another 8s timeout). This blocks Header rendering on all pages for up to 16 seconds worst case.

**Performance Impact:** CRITICAL
- Worst case: 4-16s auth initialization time (2 × 2-8s queries)
- Blocks Header component rendering on every page
- User sees no navigation until auth completes
- Affects 100% of logged-in users

## Findings

**File:** `lib/auth/auth-context.tsx:47-68`

**Current sequential implementation:**
```typescript
// Query 1: Profile fetch (up to 8s)
const { data, error } = await withTimeout(
  supabase.from('profiles').select('*').eq('id', userId).single(),
  TIMEOUT_CONFIG.CLIENT_AUTH, // 8000ms
  'Profile fetch timeout'
);

if (error) throw error;
setProfile(data);

// Query 2: Agency slug fetch (up to another 8s)
if (data?.role === 'agency_owner') {
  const { data: agency, error: agencyError } = await withTimeout(
    supabase.from('agencies').select('slug').eq('claimed_by', userId).single(),
    TIMEOUT_CONFIG.CLIENT_AUTH, // 8000ms
    'Agency slug fetch timeout'
  );
}
```

**Performance metrics:**
- Best case (both succeed fast): 200ms + 200ms = 400ms
- Typical case: 2s + 2s = 4s
- Worst case (both timeout): 8s + 8s = 16s

**User impact:**
- Navigation bar doesn't render for 4-16s
- User profile dropdown unavailable
- Agency-specific features hidden
- Perceived as "app is broken"

## Proposed Solutions

### Option 1: Parallel Promise.all with graceful degradation (Recommended)

**Approach:** Fetch both queries in parallel, handle partial success gracefully.

```typescript
const fetchProfile = async () => {
  const [profileResult, agencyResult] = await Promise.all([
    // Query 1: Profile (always needed)
    withTimeout(
      supabase.from('profiles').select('*').eq('id', userId).single(),
      TIMEOUT_CONFIG.CLIENT_AUTH,
      'Profile fetch timeout'
    ),
    // Query 2: Agency slug (speculatively fetch, may not be needed)
    withTimeout(
      supabase.from('agencies').select('slug').eq('claimed_by', userId).single(),
      TIMEOUT_CONFIG.CLIENT_AUTH,
      'Agency slug fetch timeout'
    ).catch(() => ({ data: null, error: null })) // Gracefully handle error
  ]);

  const { data: profile, error: profileError } = profileResult;
  const { data: agency } = agencyResult;

  if (profileError) throw profileError;

  setProfile(profile);

  // Only use agency slug if user is actually agency_owner
  if (profile?.role === 'agency_owner' && agency) {
    setAgencySlug(agency.slug);
  }
};
```

**Pros:**
- Reduces worst-case time from 16s to 8s (50% improvement)
- Reduces typical time from 4s to 2s (50% improvement)
- Graceful degradation if agency query fails
- Simple parallel execution pattern

**Cons:**
- Fetches agency slug even for non-agency users (wasted query ~50% of time)
- Slightly more complex error handling

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: Conditional parallel query (fetch agency only if needed)

**Approach:** First fetch profile, then if agency_owner, we already know we need it so single query.

**Pros:**
- No wasted queries for non-agency users
- More targeted approach

**Cons:**
- Still sequential (no performance improvement)
- Doesn't solve the core issue

**Effort:** 30 minutes

**Risk:** Low

---

### Option 3: Database view with LEFT JOIN

**Approach:** Create database view that JOINs profiles with agencies in a single query.

**Pros:**
- Single query = guaranteed max 8s
- Most performant solution
- Reduces database round trips

**Cons:**
- Requires database migration
- More complex schema management
- Breaks separation between profiles and agencies

**Effort:** 2-3 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `lib/auth/auth-context.tsx:47-68` - fetchProfile function
- Test all auth-dependent components render faster

**Database queries:**
- Profile: `SELECT * FROM profiles WHERE id = userId`
- Agency: `SELECT slug FROM agencies WHERE claimed_by = userId`

**Performance targets:**
- Typical case: < 3s auth initialization (currently 4s)
- Worst case: < 9s auth initialization (currently 16s)
- Best case: < 500ms auth initialization (currently 400ms)

## Resources

- **Review finding:** Performance Analysis Agent - Issue #2 (CRITICAL severity)
- **Supabase docs:** Parallel queries with Promise.all
- **Related:** Auth context also has partial state issue (see #006)

## Acceptance Criteria

- [ ] Implement parallel queries with Promise.all
- [ ] Handle graceful degradation for agency query failure
- [ ] Verify profile always loads even if agency query fails
- [ ] Test with agency_owner users (both queries succeed)
- [ ] Test with non-agency users (agency query gracefully fails)
- [ ] Test with slow database (simulated 7s latency)
- [ ] Measure before/after performance:
  - [ ] Typical case improves from 4s to <3s
  - [ ] Worst case improves from 16s to <9s
- [ ] All existing auth tests pass
- [ ] No regression in Header rendering behavior

## Work Log

### 2026-01-12 - Initial Discovery

**By:** Claude Code (Performance Analysis Agent)

**Actions:**
- Identified sequential query pattern blocking auth
- Calculated worst-case 16s delay (8s + 8s)
- Analyzed user impact on all pages (Header component)
- Drafted 3 solution approaches
- Reviewed Supabase parallel query patterns

**Learnings:**
- Auth blocking affects every page load
- Promise.all is simplest solution for parallel queries
- Graceful degradation critical for partial failures
- Database JOIN would be most performant but highest risk

## Notes

- **Urgent:** Affects all logged-in users on every page
- **Testing:** Use Chrome DevTools Network throttling to simulate slow DB
- **Monitoring:** Track auth initialization time in production
- **Related:** Fix partial state issue (#006) at the same time
