---
status: pending
priority: p1
issue_id: "016"
tags: [code-review, architecture, caching]
dependencies: ["011"]
---

# Cache Revalidation APIs Not Implemented in Codebase

## Problem Statement

**Architecture Mismatch**: The plan proposes using `revalidateTag()` for cache invalidation (lines 419-422), but this API **is not implemented** in the codebase.

**Current Caching Strategy**:
- All API routes use `export const dynamic = 'force-dynamic'`
- No tag-based caching found anywhere
- No usage of `revalidateTag()` or `revalidatePath()`

**Proposed Code** (invalid):
```typescript
revalidateTag(`agency-${agencyId}`)      // ❌ No tags defined
revalidateTag('agencies-list')            // ❌ No tags defined
revalidateTag('homepage-agencies')        // ❌ No tags defined
```

**Impact**: Proposed cache invalidation strategy won't work, homepage may show stale verified badges.

## Findings

**From Architecture Review**:
> Cache Management - The plan mentions revalidation but grep shows only 2 files mention revalidateTag, both in documentation. Current caching strategy is unclear - no evidence of tag-based caching in codebase.

**From Pattern Recognition Review**:
> CRITICAL: Cache Revalidation APIs Not Used. Plan proposes revalidateTag() but 0 usage in codebase. Codebase uses `export const dynamic = 'force-dynamic'` instead.

**Evidence**:
```bash
grep -r "revalidateTag" --include="*.ts" --include="*.tsx"
# Returns: 0 results in app/ directory
# Only found in plan documents

grep -r "export const dynamic" app/api/
# Returns: 31 API routes using 'force-dynamic'
```

## Proposed Solutions

### Solution 1: Use Router Refresh (Recommended)

**Approach**: Use client-side `router.refresh()` after mutation

**Implementation**:
```typescript
// In AgencyEditForm.tsx (after successful save)
async function onSubmit(data: AgencyEditFormData) {
  const response = await fetch(`/api/admin/agencies/${agency.id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  if (response.ok) {
    toast.success('Agency updated successfully')
    router.refresh()  // ✅ Refresh server component data
  }
}
```

**Pros**:
- Works with existing architecture
- No new APIs needed
- Refreshes current page data
- Simple, reliable

**Cons**:
- Doesn't invalidate homepage cache
- User needs to navigate to homepage to see badge

**Effort**: 5 minutes (add one line)
**Risk**: NONE

### Solution 2: Implement Tag-Based Caching System

**Approach**: Add tags to all API routes, implement revalidation

**Implementation**:
```typescript
// 1. Add tags to homepage API
export async function GET(request: Request) {
  const agencies = await fetchAgencies()
  return NextResponse.json(agencies, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}

export const revalidate = 300 // 5 minutes
export const tags = ['homepage-agencies'] // ✅ Define tag

// 2. Revalidate from mutation
import { revalidateTag } from 'next/cache'
revalidateTag('homepage-agencies')
```

**Pros**:
- Modern Next.js 14 pattern
- Granular cache control
- Homepage updates immediately

**Cons**:
- Requires refactoring 10+ API routes
- Adds architectural complexity
- 8-16 hours of work
- Not used anywhere else in codebase

**Effort**: 8-16 hours
**Risk**: HIGH (new pattern)

### Solution 3: Keep Force-Dynamic (No Cache)

**Approach**: Leave existing `dynamic = 'force-dynamic'`, no caching

**Pros**:
- Zero implementation effort
- Always fresh data
- No cache complexity

**Cons**:
- Slightly higher database load
- No performance benefit from caching

**Effort**: 0
**Risk**: NONE

## Recommended Action

✅ **Use Solution 1 (router.refresh) + Solution 3 (keep force-dynamic)**

**Rationale**:
- Matches existing architecture
- Simple, no new patterns
- Homepage already uses `force-dynamic` (always fresh)
- Router refresh ensures current page updates

**Remove from plan**:
- Lines 419-422 (revalidateTag calls)
- Add `router.refresh()` instead

## Technical Details

**Affected Files**:
- `plans/feat-admin-agency-edit-page.md` (lines 419-422) - DELETE
- `components/admin/AgencyEditForm.tsx` (after save) - ADD `router.refresh()`

**Current Homepage Caching**:
- File: `app/page.tsx`
- Strategy: Server Component with fresh data on navigation
- No explicit cache tags needed

**API Route Pattern**:
```typescript
export const dynamic = 'force-dynamic' // Current pattern (31 routes)
```

## Acceptance Criteria

- [ ] Remove revalidateTag() calls from plan
- [ ] Add router.refresh() to form submission
- [ ] Verify admin page refreshes after save
- [ ] Test homepage shows updated badge on navigation
- [ ] No cache-related errors in console

## Work Log

**2026-01-13**: Issue created from architecture and pattern reviews. Cache revalidation strategy doesn't match codebase.

## Resources

- **Current API Pattern**: All routes use `dynamic = 'force-dynamic'`
- **Homepage**: `app/page.tsx` (Server Component, no caching)
- **Router Refresh Docs**: Next.js router.refresh() API
- **Related Todo**: #011 (Server Actions removal)
