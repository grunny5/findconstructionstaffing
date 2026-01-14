---
status: pending
priority: p1
issue_id: "012"
tags: [code-review, api, blocking, security]
dependencies: []
---

# Add Verified Field to API Schema

## Problem Statement

**Missing Core Feature**: The main goal of the plan is to allow admins to edit the `verified` field, but this field is **completely missing** from the PATCH endpoint validation schema.

**Current State**:
- Database has `verified BOOLEAN DEFAULT false` (migration line 33)
- TypeScript `Agency` type lacks `verified: boolean` field
- API route `agencyUpdateSchema` (lines 19-118) does NOT include verified
- Frontend can't update this field through API

**Business Impact**:
- Core feature cannot be implemented
- Admins still need to run database scripts
- Blocks entire feature development

## Findings

**From Security Review**:
> CRIT-002: Missing `verified` Field Authorization Check. The plan proposes adding `verified: z.boolean().optional()` to the schema WITHOUT any authorization check to ensure only admins can modify this sensitive field.

**From Agent-Native Review**:
> Critical Issue #1: Verified Field Missing from API Schema. The PATCH endpoint `agencyUpdateSchema` lacks the `verified` field entirely, despite this being the plan's primary goal.

**From TypeScript Review**:
> The TypeScript `Agency` interface is missing `verified: boolean` field, creating a type/runtime mismatch.

## Proposed Solutions

### Solution 1: Add Verified to Existing Schema (Recommended)

**Implementation**:
```typescript
// app/api/admin/agencies/[id]/route.ts (line ~19)
const agencyUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(5000).optional(),
  // ... existing fields ...

  // ⭐ ADD THIS
  verified: z.boolean({
    required_error: 'Verification status must be explicitly set',
    invalid_type_error: 'Verified must be true or false'
  }).optional(),

  // ... rest of schema
});
```

**Update TypeScript Types**:
```typescript
// types/supabase.ts (line ~14)
export interface Agency {
  id: string
  name: string
  // ... existing fields ...
  verified: boolean  // ⭐ ADD THIS
  // ... rest of interface
}
```

**Pros**:
- Simple, direct fix
- Matches existing boolean field pattern (is_active, is_union)
- Explicit validation prevents null/undefined issues
- Admin-only already enforced by route (lines 154-170)

**Cons**: None

**Effort**: 5 minutes
**Risk**: LOW

### Solution 2: Add Field-Level Authorization

**Approach**: Additional check specifically for verified field changes

```typescript
// In PATCH route handler (after line 200)
if ('verified' in agencyUpdates) {
  // Extra paranoid check - only admins can change verified
  if (profile.role !== 'admin') {
    return NextResponse.json(
      { error: { message: 'Only admins can change verification status' } },
      { status: 403 }
    )
  }

  // Log verification changes separately
  console.log('[ADMIN] Verification status change:', {
    agency_id: id,
    admin_id: user.id,
    old_verified: existingAgency.verified,
    new_verified: agencyUpdates.verified,
  })
}
```

**Pros**:
- Defense in depth
- Explicit logging for sensitive field
- Clear audit trail

**Cons**:
- Redundant (admin check already at line 154)
- Adds complexity

**Effort**: 15 minutes
**Risk**: LOW

## Recommended Action

✅ **Use Solution 1 + partial Solution 2 (logging only)**

**Rationale**:
- Add verified to schema (Solution 1)
- Add verification change logging (from Solution 2)
- Skip redundant admin check (already enforced at route level)

## Technical Details

**Affected Files**:
1. `app/api/admin/agencies/[id]/route.ts` (line 19) - Add to schema
2. `types/supabase.ts` (line 14) - Add to Agency interface
3. `app/api/admin/agencies/[id]/route.ts` (line 258) - Add to updateData handling

**Validation Rules**:
- Type: `z.boolean()` (not string, not number)
- Optional: Yes (don't require in every PATCH)
- Default: Keep existing value if not provided
- Authorization: Admin-only (already enforced)

**Database Column**: `verified BOOLEAN` (already exists, no migration needed)

**Null Handling**:
```typescript
// In null conversion logic (line 248-259)
if (typeof value === 'boolean') {
  updateData[key] = value  // Keep booleans as-is
}
```

## Acceptance Criteria

- [ ] `verified: z.boolean().optional()` added to agencyUpdateSchema
- [ ] `verified: boolean` added to Agency TypeScript interface
- [ ] PATCH accepts `{"verified": true}` and `{"verified": false}`
- [ ] PATCH without verified field leaves existing value unchanged
- [ ] Verification changes logged to console with admin ID
- [ ] Type checking passes (`npm run type-check`)
- [ ] API tests updated to include verified field

## Work Log

**2026-01-13**: Issue created from code review. All agents identified this as blocking prerequisite for feature implementation.

## Resources

- **API Route**: `app/api/admin/agencies/[id]/route.ts:19`
- **TypeScript Types**: `types/supabase.ts:14`
- **Database Schema**: `supabase/migrations/001_create_core_tables.sql:33`
- **Existing Boolean Pattern**: `is_union`, `offers_per_diem` in same schema
