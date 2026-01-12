---
status: pending
priority: p1
issue_id: "006"
tags: [data-integrity, auth, state-management]
dependencies: ["003"]
---

# Fix auth context partial state inconsistency

Prevent inconsistent auth state when profile fetch succeeds but agency slug fetch times out.

## Problem Statement

Auth context sets profile first, then fetches agency slug. If profile succeeds but slug times out, state becomes inconsistent: `profile` is set but `agencySlug` is null, even though user is agency_owner. This breaks agency-specific features.

**Data Integrity Impact:** HIGH
- Inconsistent state visible to UI components
- Agency features hidden despite user being agency_owner
- No atomicity in state updates

## Findings

**File:** `lib/auth/auth-context.tsx:47-68`

**Current problematic flow:**
```typescript
setProfile(data);  // ← State update #1

if (data?.role === 'agency_owner') {
  // Agency slug fetch might timeout here
  const { data: agency } = await withTimeout(...);
  
  if (agency) {
    setAgencySlug(agency.slug);  // ← State update #2 (might not happen)
  }
}
```

**Inconsistent state scenario:**
1. Profile fetch succeeds → setProfile({ role: 'agency_owner', ... })
2. Agency slug fetch times out → agencySlug stays null
3. UI sees profile.role === 'agency_owner' BUT agencySlug === null
4. Components render incorrectly

## Proposed Solutions

### Option 1: Atomic state update (Recommended)

**Approach:** Batch both values into single setState call.

```typescript
const fetchProfile = async () => {
  try {
    const { data: profile, error } = await withTimeout(...);
    if (error) throw error;

    let slug = null;
    if (profile?.role === 'agency_owner') {
      const { data: agency } = await withTimeout(...);
      slug = agency?.slug || null;
    }

    // Single atomic state update
    setProfile(profile);
    setAgencySlug(slug);
  } catch (error) {
    // On any error, set both to null (consistent logged-out state)
    setProfile(null);
    setAgencySlug(null);
  }
};
```

**Pros:**
- Guarantees state consistency
- Simple fix
- No UI changes needed

**Cons:**
- Still sequential queries (solve with #003)

**Effort:** 30 minutes
**Risk:** Low

## Acceptance Criteria

- [ ] Refactor to batch profile + agencySlug updates
- [ ] Test profile success + slug timeout → both null OR both set
- [ ] Test profile timeout → both null
- [ ] Verify no intermediate inconsistent states
- [ ] All auth-dependent components work correctly

## Work Log

### 2026-01-12 - Initial Discovery
**By:** Claude Code (Data Integrity Review Agent)
- Identified partial state update pattern
- Traced UI impact of inconsistent state
- Designed atomic update approach

## Notes

- **Dependencies:** Should be fixed together with #003 (parallel queries)
- **Testing:** Use setTimeout to simulate timeout between queries
