---
status: pending
priority: p1
issue_id: "017"
tags: [code-review, typescript, type-safety]
dependencies: ["011"]
---

# Remove TypeScript `any` Types from Plan

## Problem Statement

**Type Safety Violations**: The plan contains multiple uses of `any` type, violating TypeScript strict mode and creating potential runtime errors.

**Critical Locations**:
1. **Server Action formData**: `formData: any` (line 368)
2. **Component props**: Untyped `{ agency, userId }` (line 216)
3. **Update record**: `updateData: Record<string, any>` (line 262)

**Impact**:
- No IntelliSense support
- Runtime errors not caught by TypeScript
- Refactoring becomes dangerous
- Security vulnerabilities (accepting any field)

## Findings

**From TypeScript Review**:
> Critical Issues (Must Fix): Remove all `any` types. Props and function parameters must be typed. FAIL: Untyped props and function parameters. This would never pass code review.

**Examples from Plan**:
```typescript
// ❌ CRITICAL FAIL (line 368)
export async function updateAgencyAction(
  agencyId: string,
  userId: string,
  formData: any  // ⚠️ Disables TypeScript entirely
) { }

// ❌ FAIL (line 216)
export function AgencyEditForm({ agency, userId }) {
  // Props completely untyped
}

// ❌ FAIL (line 262)
const updateData: Record<string, any> = {}
```

## Proposed Solutions

### Solution 1: Add Proper TypeScript Types (Required)

**Implementation**:

**1. Define Form Data Type**:
```typescript
// lib/validations/agency-edit.ts
import { z } from 'zod'

export const agencyEditSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  verified: z.boolean().optional(),
  // ... all editable fields
})

export type AgencyEditFormData = z.infer<typeof agencyEditSchema>
```

**2. Type Component Props**:
```typescript
// components/admin/AgencyEditForm.tsx
import type { Agency } from '@/types/supabase'

interface AgencyEditFormProps {
  agency: Agency & {
    trades: Array<{ trade: Trade }>
    regions: Array<{ region: Region }>
  }
  userId: string
  onSuccess?: () => void
}

export function AgencyEditForm({
  agency,
  userId,
  onSuccess
}: AgencyEditFormProps) {
  // Now fully typed
}
```

**3. Type Update Record** (if keeping Server Action):
```typescript
// app/actions/agency.ts
export async function updateAgencyAction(
  agencyId: string,
  formData: AgencyEditFormData  // ✅ Strongly typed
): Promise<UpdateAgencyResult> {
  // Implementation
}
```

**Pros**:
- Full type safety
- IntelliSense works
- Catches errors at compile time
- Safer refactoring

**Cons**: None

**Effort**: 30 minutes
**Risk**: NONE (only improvements)

### Solution 2: Use `unknown` for Validation

**Approach**: Use `unknown` instead of `any`, force validation

```typescript
export async function updateAgencyAction(
  agencyId: string,
  formData: unknown  // ✅ Forces validation
) {
  // Must validate before using
  const validationResult = agencyEditSchema.safeParse(formData)
  if (!validationResult.success) {
    return { success: false, errors: validationResult.error }
  }

  // Now validationResult.data is properly typed
  const data = validationResult.data
}
```

**Pros**: Forces explicit validation
**Cons**: More verbose than Solution 1

**Effort**: 20 minutes
**Risk**: NONE

## Recommended Action

✅ **Use Solution 1: Add proper types throughout**

**Priority Order**:
1. Define `AgencyEditFormData` type from Zod schema
2. Type all component props
3. Type all function parameters
4. Replace `Record<string, any>` with specific types

**Note**: If todo #011 is completed (remove Server Actions), the Server Action typing issue disappears entirely.

## Technical Details

**Affected Files in Plan**:
- `plans/feat-admin-agency-edit-page.md` (lines 207-339) - Add prop types
- `plans/feat-admin-agency-edit-page.md` (lines 365-429) - Type function params

**TypeScript Strict Mode**:
- Project uses `"strict": true` in tsconfig.json
- All `any` types violate strict mode
- Must pass `npm run type-check`

**Zod Integration**:
- Use `z.infer<typeof schema>` for automatic type inference
- Schema validation ensures runtime type safety
- No need to maintain separate type definitions

## Acceptance Criteria

- [ ] All function parameters properly typed (no `any`)
- [ ] All component props have TypeScript interfaces
- [ ] All variables have inferred or explicit types
- [ ] `npm run type-check` passes with zero errors
- [ ] IntelliSense works for all props and parameters
- [ ] Zod schema inferred types used throughout

## Work Log

**2026-01-13**: Issue created from TypeScript review by kieran-typescript-reviewer agent. Multiple `any` violations found.

## Resources

- **TypeScript Docs**: [Avoid `any`](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#any)
- **Zod Type Inference**: `z.infer<typeof schema>`
- **Existing Types**: `types/supabase.ts` for Agency interface
- **Related Todo**: #011 (removes Server Action with `any` parameter)
