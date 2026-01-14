# feat: Admin Agency Edit Page with Verified Status Control

## Overview

Add comprehensive admin agency edit functionality that allows administrators to modify all agency information, including the ability to manually set verified status to control badge display on the homepage. Currently, clicking an agency in the admin dashboard navigates to the public profile, and while a modal-based edit exists, it lacks the verified field control.

## Problem Statement / Motivation

**Current Limitations:**
1. Admins cannot edit the `verified` field through the UI (only via database scripts)
2. Clicking agency name in admin table goes to public profile instead of edit interface
3. The `verified` field exists in the database and controls homepage badge display, but is not exposed in the admin UI
4. Manual database updates are error-prone and lack audit trails

**Business Impact:**
- Verified badge is a trust signal on homepage (orange checkmark next to agency name)
- Currently requires running SQL scripts or using `update-verified.ts` utility
- No audit trail for who verified/unverified agencies
- Time-consuming manual process prevents scaling verification program

**User Story:**
> As an admin, I want to click on an agency in the admin dashboard and edit all its information including verified status, so that I can efficiently manage agency profiles and verification badges without database access.

## Proposed Solution

Create a dedicated admin edit page at `/admin/agencies/[id]/edit` with a comprehensive form that includes:
- All existing agency fields (name, description, contact info, etc.)
- **New**: Verified status toggle with admin-only access
- Logo upload functionality
- Trade and region selectors
- Compliance settings tab
- Real-time validation with React Hook Form + Zod
- Audit trail logging for all changes

**Navigation Flow:**
```
Admin Dashboard Table → Edit Button/Link → Edit Page → Save → Success Feedback
```

## Technical Approach

### Architecture Overview

**Stack:**
- Next.js 14.2.30 App Router (Server Components + Server Actions)
- React Hook Form 7.69.0 + Zod 3.25.76 for validation
- Supabase SSR 0.6.1 for authentication and data
- Shadcn/ui components for consistent UI
- Sonner for toast notifications

**Pattern:**
- Server Component for page layout and initial data fetch
- Client Component for form (requires `'use client'` for React Hook Form)
- Server Action for PATCH mutation (keeps sensitive operations server-side)
- Tag-based cache revalidation for immediate homepage updates

### Implementation Phases

#### Phase 1: API Schema Update
**Goal:** Add `verified` field to PATCH endpoint validation

**Files to Modify:**
- `app/api/admin/agencies/[id]/route.ts` (lines 19-118)
- `lib/validations/agency-creation.ts`

**Changes:**
```typescript
// app/api/admin/agencies/[id]/route.ts
const agencyUpdateSchema = z.object({
  // ... existing fields ...
  verified: z.boolean().optional(), // ⭐ ADD THIS
});
```

**Success Criteria:**
- [ ] `verified` field accepted by PATCH endpoint
- [ ] Validation passes for `verified: true` and `verified: false`
- [ ] Database update includes `verified` field
- [ ] Audit trail entry created for verified changes

---

#### Phase 2: Navigation Enhancement
**Goal:** Enable navigation from admin table to edit page

**Files to Modify:**
- `components/admin/AdminAgenciesTable.tsx` (lines 252-262)

**Option A (Recommended):** Add Edit button column
```tsx
// components/admin/AdminAgenciesTable.tsx
<TableCell>
  <Link href={`/admin/agencies/${agency.id}/edit`}>
    <Button variant="ghost" size="sm">
      <Pencil className="h-4 w-4" />
      Edit
    </Button>
  </Link>
</TableCell>
```

**Option B:** Change name link destination
```tsx
// Make agency name link to edit page instead of public profile
<Link href={`/admin/agencies/${agency.id}/edit`}>
  {agency.name}
</Link>
```

**Success Criteria:**
- [ ] Clicking edit button/link navigates to `/admin/agencies/[id]/edit`
- [ ] Admin role check prevents non-admin access
- [ ] New tab navigation works (`target="_blank"`)
- [ ] Navigation preserves admin table filters/pagination state

---

#### Phase 3: Edit Page Creation
**Goal:** Create server component page with authentication

**New File:** `app/(app)/admin/agencies/[id]/edit/page.tsx`

**Implementation:**
```typescript
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgencyEditForm } from '@/components/admin/AgencyEditForm'

interface PageProps {
  params: { id: string }
}

export default async function AgencyEditPage({ params }: PageProps) {
  const supabase = await createClient()

  // 1. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    redirect('/login')
  }

  // 2. Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // 3. Fetch agency data with relationships
  const { data: agency, error } = await supabase
    .from('agencies')
    .select(`
      *,
      trades:agency_trades(trade:trades(id, name, slug)),
      regions:agency_regions(region:regions(id, name, code))
    `)
    .eq('id', params.id)
    .single()

  if (error || !agency) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Agency</h1>
        <p className="text-muted-foreground mt-2">
          Update agency information and verification status
        </p>
      </div>

      <AgencyEditForm agency={agency} userId={user.id} />
    </div>
  )
}
```

**Success Criteria:**
- [ ] Page accessible at `/admin/agencies/[id]/edit`
- [ ] Authentication redirects work correctly
- [ ] Non-admin users see 403/redirect to home
- [ ] Agency data loads with trades and regions
- [ ] 404 page shows for invalid agency IDs

---

#### Phase 4: Edit Form Component
**Goal:** Create comprehensive form with all fields including verified

**New File:** `components/admin/AgencyEditForm.tsx`

**Key Features:**
- React Hook Form with Zod validation
- All agency fields editable
- **Verified toggle** in "Status & Permissions" section
- Logo upload with preview
- Trade/region multi-select
- Server Action integration
- Loading states and error handling

**Form Structure:**
```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateAgencyAction } from '@/app/actions/agency'
import { agencyEditSchema, type AgencyEditFormData } from '@/lib/validations/agency'

export function AgencyEditForm({ agency, userId }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AgencyEditFormData>({
    resolver: zodResolver(agencyEditSchema),
    defaultValues: {
      name: agency.name,
      description: agency.description || '',
      website: agency.website || '',
      email: agency.email || '',
      phone: agency.phone || '',
      founded_year: agency.founded_year,
      headquarters: agency.headquarters || '',
      employee_count: agency.employee_count || '',
      company_size: agency.company_size,
      is_active: agency.is_active,
      offers_per_diem: agency.offers_per_diem,
      is_union: agency.is_union,
      verified: agency.verified || false, // ⭐ VERIFIED FIELD
      logo_url: agency.logo_url || '',
    },
  })

  async function onSubmit(data: AgencyEditFormData) {
    setIsSubmitting(true)
    const result = await updateAgencyAction(agency.id, userId, data)
    setIsSubmitting(false)

    if (result.success) {
      toast.success('Agency updated successfully')
    } else {
      toast.error(result.message || 'Failed to update agency')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name, Description, Contact fields */}
          </CardContent>
        </Card>

        {/* Status & Permissions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ⭐ VERIFIED TOGGLE */}
            <FormField
              control={form.control}
              name="verified"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Verified Agency</FormLabel>
                    <FormDescription>
                      Show orange verification badge on homepage next to agency name
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* is_active, offers_per_diem, is_union toggles */}
          </CardContent>
        </Card>

        {/* Logo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Agency Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoUpload
              currentUrl={agency.logo_url}
              onUpload={(url) => form.setValue('logo_url', url)}
            />
          </CardContent>
        </Card>

        {/* Trades & Regions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Service Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TradeSelector
              value={form.watch('trade_ids')}
              onChange={(ids) => form.setValue('trade_ids', ids)}
            />
            <RegionSelector
              value={form.watch('region_ids')}
              onChange={(ids) => form.setValue('region_ids', ids)}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

**Success Criteria:**
- [ ] Form displays all agency fields
- [ ] Verified toggle works and saves to database
- [ ] Real-time validation shows errors
- [ ] Logo upload preview works
- [ ] Trade/region selectors function correctly
- [ ] Save button shows loading state
- [ ] Success/error toasts display appropriately

---

#### Phase 5: Server Action for Updates
**Goal:** Secure server-side mutation with audit trail

**New File:** `app/actions/agency.ts`

**Implementation:**
```typescript
'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { agencyEditSchema } from '@/lib/validations/agency'

export async function updateAgencyAction(
  agencyId: string,
  userId: string,
  formData: any
) {
  // 1. Validate input
  const validationResult = agencyEditSchema.safeParse(formData)

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  // 2. Get current values for audit trail
  const { data: currentAgency } = await supabase
    .from('agencies')
    .select('verified, name, is_active')
    .eq('id', agencyId)
    .single()

  // 3. Update agency
  const { data, error } = await supabase
    .from('agencies')
    .update({
      ...validationResult.data,
      updated_at: new Date().toISOString(),
      last_edited_at: new Date().toISOString(),
      last_edited_by: userId,
    })
    .eq('id', agencyId)
    .select()
    .single()

  if (error) {
    return { success: false, message: 'Failed to update agency' }
  }

  // 4. Create audit trail for verified status change
  if (currentAgency.verified !== validationResult.data.verified) {
    await supabase.from('agency_profile_edits').insert({
      agency_id: agencyId,
      edited_by: userId,
      field_name: 'verified',
      old_value: String(currentAgency.verified),
      new_value: String(validationResult.data.verified),
      edited_at: new Date().toISOString(),
    })
  }

  // 5. Revalidate caches
  revalidateTag(`agency-${agencyId}`)
  revalidateTag('agencies-list')
  revalidateTag('homepage-agencies')

  return {
    success: true,
    message: 'Agency updated successfully',
    data,
  }
}
```

**Success Criteria:**
- [ ] Server Action authenticates admin user
- [ ] Validation errors return to form
- [ ] Database update includes all fields
- [ ] Verified changes logged to audit table
- [ ] Cache invalidation triggers
- [ ] Homepage badge updates within 5 seconds

---

## Technical Considerations

### Security
- **Authentication**: Every admin page checks `user.role === 'admin'` before render
- **Authorization**: Server Actions re-validate admin role (defense in depth)
- **Audit Trail**: All verified status changes logged to `agency_profile_edits` table
- **Input Validation**: Zod schemas on both client and server prevent malicious input
- **CSRF Protection**: Next.js Server Actions include automatic CSRF tokens

### Performance
- **Server Components**: Initial page render from server (no JS needed for load)
- **Lazy Form Validation**: Only validate on blur/submit to reduce CPU overhead
- **Optimized Queries**: Single query with joins for trades/regions (not N+1)
- **Cache Invalidation**: Tag-based revalidation (faster than path-based)
- **Image Optimization**: Automatic Next.js image optimization for logo previews

### Data Integrity
- **Audit Trail**: `agency_profile_edits` table tracks who changed what and when
- **Timestamps**: `updated_at` and `last_edited_at` always set on mutations
- **Null Handling**: Empty strings converted to `null` for database consistency
- **Transaction Safety**: Supabase RLS policies prevent data corruption

### User Experience
- **Real-Time Validation**: Immediate feedback on invalid inputs
- **Loading States**: Button shows "Saving..." during submission
- **Success Feedback**: Toast notification confirms save
- **Error Recovery**: Validation errors keep form data, allow retry
- **Accessibility**: Proper form labels, ARIA attributes, keyboard navigation

## Acceptance Criteria

### Functional Requirements
- [ ] Admin can navigate from dashboard table to edit page
- [ ] Edit page displays all agency fields pre-populated
- [ ] Admin can toggle verified status with Switch component
- [ ] Verified badge appears on homepage when `verified=true`
- [ ] Verified badge disappears when `verified=false`
- [ ] All field changes save to database
- [ ] Logo upload works and updates preview
- [ ] Trade/region selectors allow multi-select
- [ ] Cancel button navigates back to admin table
- [ ] Success toast shows after successful save
- [ ] Error messages display for validation failures

### Non-Functional Requirements
- [ ] Page loads in under 2 seconds (P95)
- [ ] Form validation responds in under 100ms
- [ ] Homepage badge updates within 5 seconds of save
- [ ] Works on Chrome, Firefox, Safari, Edge (latest 2 versions)
- [ ] Fully keyboard accessible (tab navigation, enter to submit)
- [ ] Screen reader compatible (tested with VoiceOver/NVDA)
- [ ] Mobile responsive (usable on 375px viewport)

### Security Requirements
- [ ] Non-admin users redirected from edit page
- [ ] Unauthenticated users redirected to login
- [ ] Server Action validates admin role
- [ ] All inputs validated server-side with Zod
- [ ] Audit trail created for verified status changes
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities in form inputs

### Quality Gates
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings
- [ ] Component tests pass (if written)
- [ ] Manual testing on staging environment
- [ ] Code reviewed by team lead
- [ ] Accessibility audit passes (WAVE/axe DevTools)

## Success Metrics

**Efficiency:**
- Time to verify agency: ~60 seconds (from dashboard to save)
- Reduction in database script usage: 100% (eliminate manual updates)

**Reliability:**
- Audit trail coverage: 100% of verified status changes
- Cache invalidation success rate: >99%

**User Satisfaction:**
- Admin feedback: "Much easier than running scripts"
- Zero reported bugs in first 2 weeks

## Dependencies & Prerequisites

### External Dependencies
- Supabase service must be available
- `agency_profile_edits` table exists (from migration)
- Admin users have `role='admin'` in profiles table

### Internal Dependencies
- Auth middleware must validate sessions
- Homepage cache must use tags (for invalidation)
- Existing modal edit can remain (no conflicts)

### Schema Changes Required
- [ ] Add `verified: boolean` to `agencyUpdateSchema` (route.ts line 19)
- [ ] Add `verified: z.boolean().optional()` to validation schema

## Risk Analysis & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Concurrent edits overwrite changes | High | Medium | Add last-edited-at check, warn if edited recently |
| Cache doesn't invalidate | Medium | Low | Use tag-based revalidation, monitor with logging |
| Admins accidentally unverify agencies | Medium | Medium | Add confirmation modal for verified=false |
| Logo upload fails silently | Low | Low | Show error toast, keep form open for retry |
| Session expires during edit | Low | Medium | Extend session on activity, auto-save drafts |

**Mitigation Plan:**
1. **Concurrent Edits**: Show warning if `last_edited_at` is within 5 minutes
2. **Cache Invalidation**: Log revalidation calls, alert on failures
3. **Accidental Unverify**: Require confirmation checkbox "I understand this will remove the verified badge"
4. **Upload Failures**: Display error, keep form data, allow retry
5. **Session Expiry**: Extend cookie on form interaction, localStorage backup

## Future Considerations

### Extensibility
- **Bulk Verification**: Select multiple agencies, verify all at once
- **Verification Workflow**: Request verification → Review → Approve pattern
- **Conditional Verification**: Auto-verify if profile >80% complete + has compliance
- **Verification Expiry**: Set expiration date, auto-unverify after N months

### Scalability
- **Pagination**: Edit page currently loads all trades/regions (57 + 35 items)
  - Future: Virtualized lists for 1000+ options
- **Audit Log Viewer**: Admin page to view all verification history
- **Role-Based Permissions**: Super Admin can verify, Regular Admin cannot

### Integration
- **Webhook Notifications**: Trigger webhook when agency verified (notify agency owner)
- **Slack Integration**: Post to #agency-verifications channel on status change
- **Email Notifications**: Send "Your agency has been verified!" email

## References & Research

### Internal References
- **Admin Table**: `components/admin/AdminAgenciesTable.tsx:252-262`
- **Agency Card Badge**: `components/AgencyCard.tsx:192-211`
- **Existing Modal**: `components/admin/AgencyFormModal.tsx:102-726`
- **API Route**: `app/api/admin/agencies/[id]/route.ts:122-369`
- **Validation Schema**: `lib/validations/agency-creation.ts:84-179`
- **Auth Pattern**: `app/(app)/admin/agencies/page.tsx:8-29`

### External References
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Hook Form Docs](https://react-hook-form.com/get-started)
- [Zod Validation](https://zod.dev)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Shadcn/ui Form Components](https://ui.shadcn.com/docs/components/form)

### Related Work
- **PR #675**: Added verified badge display and seed script
- **Script**: `scripts/update-verified.ts` - Manual verification utility
- **Migration**: `001_create_core_tables.sql` - Agencies table schema

### Best Practices Applied
- Tag-based cache revalidation (2025 Next.js pattern)
- Server Actions for mutations (avoid API routes)
- Errors as data (return `{ success, error }` objects)
- Optimistic UI updates (React 18 compatible pattern)
- Audit logging for accountability

---

## Implementation Checklist

### Phase 1: API Schema ✅
- [ ] Add `verified` to `agencyUpdateSchema` in route.ts
- [ ] Add `verified` to `agencyEditSchema` in validations
- [ ] Test PATCH endpoint accepts verified field
- [ ] Verify audit trail creation

### Phase 2: Navigation ✅
- [ ] Add Edit button/link to AdminAgenciesTable
- [ ] Test navigation to `/admin/agencies/[id]/edit`
- [ ] Verify new tab navigation works
- [ ] Check admin-only access

### Phase 3: Edit Page ✅
- [ ] Create `app/(app)/admin/agencies/[id]/edit/page.tsx`
- [ ] Add authentication checks
- [ ] Fetch agency data with relationships
- [ ] Test 404 handling for invalid IDs

### Phase 4: Edit Form ✅
- [ ] Create `AgencyEditForm.tsx` component
- [ ] Implement all field inputs
- [ ] Add verified toggle in Status section
- [ ] Integrate React Hook Form + Zod
- [ ] Add loading states
- [ ] Wire up Server Action

### Phase 5: Server Action ✅
- [ ] Create `updateAgencyAction` in actions/agency.ts
- [ ] Add authentication/authorization
- [ ] Implement validation
- [ ] Create audit trail entries
- [ ] Add cache invalidation
- [ ] Test error handling

### Phase 6: Testing ✅
- [ ] Manual testing on local environment
- [ ] Test all validation scenarios
- [ ] Verify badge appears/disappears on homepage
- [ ] Test concurrent admin edits
- [ ] Test session expiration handling
- [ ] Accessibility audit

### Phase 7: Documentation ✅
- [ ] Update CLAUDE.md with new admin routes
- [ ] Document verified field in API docs
- [ ] Add JSDoc comments to Server Action
- [ ] Update team wiki with verification process

---

## Open Questions

1. **Should unsaved changes show a warning before navigation?**
   - Current assumption: No warning (matches existing modal behavior)
   - Alternative: Add `beforeunload` handler for better UX

2. **Should changing verified status require confirmation?**
   - Current assumption: No confirmation, immediate toggle
   - Alternative: Modal confirmation "Remove verified badge from [Agency Name]?"

3. **Where should user land after successful save?**
   - Current assumption: Stay on edit page with success toast
   - Alternative: Redirect to admin agencies table

4. **Should admins be able to edit the agency slug?**
   - Current assumption: Slug is read-only (auto-generated from name)
   - Alternative: Editable with warning about breaking existing links

5. **What happens if another admin is editing simultaneously?**
   - Current assumption: Last write wins (current API behavior)
   - Alternative: Show warning "Last edited by [Name] 2 minutes ago"

**Next Steps:** Clarify these questions with product owner before implementation begins.
