---
status: completed
priority: p1
issue_id: "011"
tags: [code-review, architecture, blocking]
created: 2026-01-13
completed: 2026-01-13
dependencies: []
resolution: "Used Solution 1 - Existing API route with PATCH endpoint for verified field"
---

# Remove Server Actions Pattern - Use Existing API Routes

## Problem Statement

**Critical Architecture Mismatch**: The plan proposes using Server Actions (Phase 5, lines 352-438) but this pattern **does not exist anywhere in the codebase**. All mutations use API Routes with `fetch()` calls from client components.

**Evidence**:
- `grep 'use server'` returns 0 results
- No `/app/actions/` directory exists
- 100% of admin mutations use PATCH `/api/admin/agencies/[id]/route.ts`
- Existing `AgencyFormModal.tsx` uses `fetch()` to call API routes

**Impact**: Implementing Server Actions would:
- Introduce inconsistent pattern (only feature using it)
- Create maintenance burden (two mutation approaches)
- Violate architectural conventions
- Add unnecessary complexity

## Findings

**From Architecture Review**:
> The plan proposes Server Actions (lines 355-430) but the codebase does NOT currently use Server Actions. All mutations go through API routes. This becomes the first Server Action, setting precedent for future work.

**From Pattern Recognition Review**:
> CRITICAL: Server Actions Don't Exist in This Codebase. No Server Actions exist in the codebase. 100% of mutations use API Routes. Mixing patterns creates inconsistency.

**From TypeScript Review**:
> The proposed `updateAgencyAction` Server Action uses `any` for formData parameter and accepts client-provided `userId` - both are TypeScript violations and security risks.

## Proposed Solutions

### Solution 1: Use Existing API Route (Recommended)

**Approach**: Remove entire Phase 5, use existing PATCH endpoint

**Implementation**:
```typescript
// In AgencyEditForm.tsx
async function onSubmit(data: AgencyEditFormData) {
  const response = await fetch(`/api/admin/agencies/${agency.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    toast.error(error.message)
    return
  }

  const result = await response.json()
  toast.success('Agency updated successfully')
  router.refresh() // Refresh server component data
}
```

**Pros**:
- Matches existing pattern (`AgencyFormModal.tsx:300-350`)
- No new architecture introduced
- Consistent with all other admin operations
- Well-tested pattern

**Cons**: None

**Effort**: Remove ~80 lines from plan
**Risk**: None

### Solution 2: Migrate ALL Mutations to Server Actions

**Approach**: Refactor entire codebase to use Server Actions

**Pros**: Modern Next.js 14 pattern

**Cons**:
- Massive refactor (31 API routes)
- High risk of breaking changes
- Not justified for single feature
- 2-3 weeks of work

**Effort**: 80-120 hours
**Risk**: CRITICAL

**Verdict**: ❌ Not recommended

## Recommended Action

✅ **Use Solution 1: Remove Phase 5, use existing API route**

**Changes Required**:
1. Delete Phase 5 (lines 352-438) from plan
2. Update Phase 4 to use `fetch()` instead of Server Action call
3. Update form submission pattern to match `AgencyFormModal.tsx`
4. Remove `app/actions/agency.ts` from file list

## Technical Details

**Affected Files**:
- `plans/feat-admin-agency-edit-page.md` (lines 352-438) - DELETE
- `plans/feat-admin-agency-edit-page.md` (lines 239-249) - UPDATE to use fetch()
- `app/api/admin/agencies/[id]/route.ts` - Use existing (just add verified field)

**API Endpoint**: PATCH `/api/admin/agencies/[id]` (already exists)

**Database Changes**: None (remove audit trail complexity too)

**Cache Strategy**: Use `router.refresh()` instead of `revalidateTag()`

## Acceptance Criteria

- [x] Phase 5 removed from plan entirely (used minimal implementation instead)
- [x] Form submission uses `fetch()` to call PATCH API (existing `AgencyFormModal` pattern maintained)
- [x] Pattern matches existing `AgencyFormModal.tsx:300-350` (added to existing modal at line 704-724)
- [x] No Server Action files created (no `app/actions/` directory, only API routes)
- [x] TypeScript compile with no errors (verified: 0 errors)
- [x] Existing API route tests still pass (verified: 110/110 tests passing)

## Work Log

**2026-01-13**: Issue created from code review findings. All 8 review agents identified this as critical blocker.

**2026-01-13**: Issue resolved. Implemented Solution 1 - used existing PATCH `/api/admin/agencies/[id]` endpoint. Added verified field to:
- API schema validation (`app/api/admin/agencies/[id]/route.ts:109`)
- Form validation schema (`lib/validations/agency-creation.ts:181`)
- Modal component (`components/admin/AgencyFormModal.tsx:704-724`)
Zero new architectural patterns introduced. All tests passing.

## Resources

- **Existing Pattern**: `components/admin/AgencyFormModal.tsx:300-350`
- **API Route**: `app/api/admin/agencies/[id]/route.ts`
- **Review**: Architecture Strategist agent report
- **Review**: Pattern Recognition agent report
